// src/hooks.server.js
import { auth } from '$lib/server/lucia'
import { prisma } from '$lib/server/prisma'
import { dbSeeded } from '$lib/utils/seed/seedHelpers'
import { env } from '$env/dynamic/private'
import { getClientIp, makeLimiter } from '$lib/server/rateLimit'
import { resolveSiteConfig } from '$lib/server/siteConfig'
import { warmIngredientIndex } from '$lib/utils/converterBackend'
import { redirect } from '@sveltejs/kit'

// Build the ingredient search index at startup rather than on the first unit conversion
warmIngredientIndex()

// Paths that stay reachable when "require login" is on
const PUBLIC_PATHS = [
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

// Local dev/Docker origins allowed to call the API cross-origin (e.g. the Vite dev server)
const CORS_ORIGINS = new Set([
	'http://127.0.0.1:3000',
	'http://0.0.0.0:3000',
	'http://localhost:3000',
	'http://127.0.0.1:5173',
	'http://localhost:5173'
])

const corsHeaders = (origin) => ({
	'Access-Control-Allow-Origin': origin,
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'authorization, content-type, x-requested-with',
	'Access-Control-Allow-Credentials': 'true'
})

const isPublicPath = (pathname) => PUBLIC_PATHS.some((path) => pathname.startsWith(path))

/**
 * Over plain HTTP (e.g. a LAN install without TLS) browsers drop `Secure` cookies, so strip
 * the flag from the session cookie to keep logins working.
 */
function allowSessionCookieOverHttp(response) {
	const sessionCookie = 'auth_session=' // Lucia v2's session cookie name
	const cookies = response.headers.getSetCookie()
	if (!cookies.some((c) => c.startsWith(sessionCookie))) return

	response.headers.delete('set-cookie')
	for (const cookie of cookies) {
		response.headers.append(
			'set-cookie',
			cookie.startsWith(sessionCookie) ? cookie.replace(/;\s*Secure\b/gi, '') : cookie
		)
	}
}

/**
 * SvelteKit request hook: validates the session, attaches the rate limiter and site
 * configuration to `event.locals`, enforces "require login", and applies the plain-HTTP
 * session cookie fix and dev CORS headers to the response.
 *
 * @type {import('@sveltejs/kit').Handle}
 */
export const handle = async ({ event, resolve }) => {
	// Session
	event.locals.auth = auth.handleRequest(event)
	const session = await event.locals.auth.validate()
	event.locals.session = session ?? null
	event.locals.user = session?.user ?? null

	// Rate limiting
	event.locals.clientIp = getClientIp(event)
	event.locals.limiter = makeLimiter(env)

	// Site-wide settings, OAuth providers, AI and semantic search config
	const seeded = await dbSeeded(prisma)
	const settingsRow = seeded ? await prisma.siteSettings.findFirst() : null
	event.locals.site = resolveSiteConfig({ seeded, settingsRow, env })

	const { pathname } = event.url
	if (event.locals.site.settings.requireLogin && !event.locals.user && !isPublicPath(pathname)) {
		if (pathname.startsWith('/api/')) {
			return new Response(JSON.stringify({ error: 'Authentication required' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		redirect(302, '/login')
	}

	const origin = event.request.headers.get('origin') || ''
	const corsAllowed = CORS_ORIGINS.has(origin)

	if (event.request.method === 'OPTIONS' && corsAllowed) {
		return new Response(null, { status: 204, headers: { ...corsHeaders(origin), Vary: 'Origin' } })
	}

	const response = await resolve(event)

	if (event.url.protocol === 'http:' || env.ORIGIN?.startsWith('http://')) {
		allowSessionCookieOverHttp(response)
	}

	if (corsAllowed) {
		for (const [name, value] of Object.entries(corsHeaders(origin))) {
			response.headers.set(name, value)
		}
		response.headers.append('Vary', 'Origin')
	}

	return response
}
