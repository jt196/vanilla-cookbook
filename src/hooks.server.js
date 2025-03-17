import { auth } from '$lib/server/lucia'

/**
 * @typedef {Object} EventObject
 * @property {any} locals - Local variables.
 */

/**
 * Handle the incoming event and set up the authentication.
 *
 * @param {Object} options - The function options.
 * @param {EventObject} options.event - The incoming event object.
 * @param {Function} options.resolve - The resolve function.
 *
 * @returns {Promise<any>} The result after resolving the event.
 */
export const handle = async ({ event, resolve }) => {
	event.locals.auth = auth.handleRequest(event)

	const response = await resolve(event)

	// Only apply CORS headers during test/CI/dev environments
	const allowedOrigins = ['http://127.0.0.1:3000', 'http://localhost:3000']
	const requestOrigin = event.request.headers.get('origin')
	console.log('[CORS]', requestOrigin)

	if (allowedOrigins.includes(requestOrigin)) {
		response.headers.set('Access-Control-Allow-Origin', requestOrigin)
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
		response.headers.set('Access-Control-Allow-Headers', '*')
		// Allow credentials (cookies) if needed
		response.headers.set('Access-Control-Allow-Credentials', 'true')
	}

	return response
}
