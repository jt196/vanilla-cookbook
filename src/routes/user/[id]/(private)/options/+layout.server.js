/**
 * Validates the current user's authentication status and returns user data.
 * @async
 * @function
 * @param {Object} locals - The context object containing authentication data.
 * @returns {Object} Returns the authenticated user object.
 */
import { requireUser } from '$lib/server/authPage'

export const load = async ({ url, locals }) => {
	const user = requireUser(locals)
	return { user, pathname: url.pathname }
}
