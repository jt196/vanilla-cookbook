/**
 * Validates the current user's authentication status and returns user data.
 * @async
 * @function
 * @param {Object} locals - The context object containing authentication data.
 * @returns {Object} Returns the authenticated user object.
 */
export const load = async ({ url, locals }) => {
	const user = locals.user
	return { user, pathname: url.pathname }
}
