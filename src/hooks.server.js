// src/hooks.server.js
import { auth } from '$lib/server/lucia'
import { prisma } from '$lib/server/prisma'
import { dbSeeded } from '$lib/utils/seed/seedHelpers'
import { env } from '$env/dynamic/private'
import { getClientIp, makeLimiter } from '$lib/server/rateLimit'

const envTrue = (v) => typeof v === 'string' && /^(true|1|yes|on)$/i.test(v.trim())

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
	const oauthEnabled = !!(googleEnabled && githubEnabled)
	const oauth = {
		githubEnabled,
		googleEnabled,
		oauthEnabled
	}

	const ai = {
		aiEnabled: envTrue(env.LLM_API_ENABLED),
		apiKeyPresent: !!env.OPENAI_API_KEY
	}

	// Site-wide bits (do once here)
	const seeded = await dbSeeded(prisma)
	let settings
	if (seeded) {
		const s = await prisma.siteSettings.findFirst()

		const regAllowed =
			env.REGISTRATION_ALLOWED !== undefined
				? envTrue(env.REGISTRATION_ALLOWED)
				: !!s?.registrationAllowed

		// normalize onto settings so everyone just reads settings.registrationAllowed
		settings = { ...s, registrationAllowed: regAllowed }
	}

	event.locals.site = {
		dbSeeded: seeded,
		settings,
		oauth,
		ai
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
