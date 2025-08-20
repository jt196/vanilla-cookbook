// src/hooks.server.js
import { auth } from '$lib/server/lucia'

export const handle = async ({ event, resolve }) => {
	event.locals.auth = auth.handleRequest(event)

	// hydrate once so loaders/actions can use locals.user immediately
	const session = await event.locals.auth.validate()
	event.locals.session = session ?? null
	event.locals.user = session?.user ?? null

	// your CORS bits
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
