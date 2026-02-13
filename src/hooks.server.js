// src/hooks.server.js
import { auth } from '$lib/server/lucia'
import { prisma } from '$lib/server/prisma'
import { dbSeeded } from '$lib/utils/seed/seedHelpers'
import { env } from '$env/dynamic/private'
import { getClientIp, makeLimiter } from '$lib/server/rateLimit'
import { redirect } from '@sveltejs/kit'

const envTrue = (v) => typeof v === 'string' && /^(true|1|yes|on)$/i.test(v.trim())

// Routes that should always be accessible even when requireLogin is enabled
const publicRoutes = [
	'/login',
	'/register',
	'/api/auth',
	'/api/oauth',
	'/api/health',
	'/_app', // SvelteKit internals
	'/favicon',
	'/manifest',
	'/sw.js',
	'/workbox'
]

function isPublicRoute(pathname) {
	return publicRoutes.some((route) => pathname.startsWith(route))
}

export const handle = async ({ event, resolve }) => {
	// Lucia
	event.locals.auth = auth.handleRequest(event)
	const session = await event.locals.auth.validate()
	event.locals.session = session ?? null
	event.locals.user = session?.user ?? null

	// expose limiter + ip
	event.locals.clientIp = getClientIp(event)
	event.locals.limiter = makeLimiter(env)

	// ---- OAuth provider flags (succinct) ----
	const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = env

	const githubEnabled = !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET)
	const googleEnabled = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET)
	const oidcConfigured = !!(env.OIDC_ISSUER_URL && env.OIDC_CLIENT_ID && env.OIDC_CLIENT_SECRET)
	const oauthEnabled = githubEnabled || googleEnabled || oidcConfigured
	const oauth = {
		githubEnabled,
		googleEnabled,
		oidcEnabled: oidcConfigured,
		oidcName: env.OIDC_NAME?.trim() || 'OIDC',
		oauthEnabled
	}

	// ---- Detect available LLM providers based on API keys ----
	const availableProviders = []
	if (env.OPENAI_API_KEY) availableProviders.push('openai')
	if (env.ANTHROPIC_API_KEY) availableProviders.push('anthropic')
	if (env.GOOGLE_API_KEY) availableProviders.push('google')
	if (env.OLLAMA_BASE_URL) availableProviders.push('ollama')

	const hasAnyApiKey = availableProviders.length > 0

	// Site-wide bits (do once here)
	const seeded = await dbSeeded(prisma)
	let settings
	let ai

	if (seeded) {
		const s = await prisma.siteSettings.findFirst()

		const regAllowed =
			env.REGISTRATION_ALLOWED !== undefined
				? envTrue(env.REGISTRATION_ALLOWED)
				: !!s?.registrationAllowed

		// LLM config: DB settings take precedence, then env fallbacks
		// Only enabled if DB says so AND we have API keys
		const llmEnabled = hasAnyApiKey && (s?.llmEnabled ?? envTrue(env.LLM_API_ENABLED))

		// Provider: DB setting → env fallback → first available
		const llmProvider = s?.llmProvider || env.LLM_PROVIDER || availableProviders[0] || 'openai'

		// Models: DB setting → env fallback
		const textModel = s?.llmTextModel || env.LLM_TEXT_MODEL || null
		const imageModel = s?.llmImageModel || env.LLM_IMAGE_MODEL || null

		ai = {
			enabled: llmEnabled,
			hasAnyApiKey,
			availableProviders,
			provider: llmProvider,
			textModel,
			imageModel,
			imageAllowed: llmProvider !== 'ollama'
		}

		// normalize onto settings so everyone just reads settings.*
		settings = { ...s, registrationAllowed: regAllowed, requireLogin: s?.requireLogin ?? false }
	} else {
		// Provide safe defaults when not seeded to avoid undefined access
		settings = { registrationAllowed: false, requireLogin: false }
		ai = {
			enabled: false,
			hasAnyApiKey,
			availableProviders,
			provider: null,
			textModel: null,
			imageModel: null,
			imageAllowed: false
		}
	}

	event.locals.site = {
		dbSeeded: seeded,
		settings,
		oauth,
		ai
	}

	// ---- Enforce login requirement if enabled ----
	if (settings.requireLogin && !event.locals.user && !isPublicRoute(event.url.pathname)) {
		// For API routes, return 401 instead of redirecting
		if (event.url.pathname.startsWith('/api/')) {
			return new Response(JSON.stringify({ error: 'Authentication required' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		// Redirect to login page for regular pages
		redirect(302, '/login')
	}

	// --- your CORS code unchanged ---
	const allowed = new Set([
		'http://127.0.0.1:3000',
		'http://0.0.0.0:3000',
		'http://localhost:3000',
		'http://127.0.0.1:5173',
		'http://localhost:5173'
	])
	const origin = event.request.headers.get('origin') || ''

	if (event.request.method === 'OPTIONS' && allowed.has(origin)) {
		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': origin,
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'authorization, content-type, x-requested-with',
				'Access-Control-Allow-Credentials': 'true',
				Vary: 'Origin'
			}
		})
	}

	const response = await resolve(event)

	const isHttpRequest =
		event.url?.protocol === 'http:' || (env.ORIGIN?.startsWith('http://') ?? false)
	if (isHttpRequest) {
		const sessionCookieName = auth.sessionCookieName ?? 'auth_session'
		const setCookies =
			typeof response.headers.getSetCookie === 'function'
				? response.headers.getSetCookie()
				: splitSetCookieHeader(response.headers.get('set-cookie'))

		if (setCookies.length > 0) {
			const updated = setCookies.map((value) => {
				if (!value.startsWith(`${sessionCookieName}=`)) return value
				return value.replace(/;\s*Secure\b/gi, '')
			})

			response.headers.delete('set-cookie')
			for (const value of updated) {
				response.headers.append('set-cookie', value)
			}
		}
	}

	if (allowed.has(origin)) {
		response.headers.set('Access-Control-Allow-Origin', origin)
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
		response.headers.set(
			'Access-Control-Allow-Headers',
			'authorization, content-type, x-requested-with'
		)
		response.headers.set('Access-Control-Allow-Credentials', 'true')
		response.headers.append('Vary', 'Origin')
	}

	return response
}

const splitSetCookieHeader = (header) => {
	if (!header) return []
	const cookies = []
	let current = ''
	let inExpires = false

	for (let i = 0; i < header.length; i++) {
		const slice = header.slice(i, i + 8).toLowerCase()
		if (slice === 'expires=') {
			inExpires = true
			current += header[i]
			continue
		}

		const ch = header[i]
		if (ch === ';') {
			inExpires = false
			current += ch
			continue
		}

		if (ch === ',' && !inExpires) {
			if (current.trim()) cookies.push(current.trim())
			current = ''
			continue
		}

		current += ch
	}

	if (current.trim()) cookies.push(current.trim())
	return cookies
}
