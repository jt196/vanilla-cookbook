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
	return await resolve(event)
}
