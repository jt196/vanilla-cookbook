/**
 * Server-side logic to load user data for the layout.
 * @param {Object} context - The context for the server-side loading.
 * @param {AppLocals} context.locals - The local context which includes authentication data.
 * @returns {Promise<Object>} The result of the loading logic, which includes the user data.
 */
export const load = async ({ locals }) => {
	const { session, user } = await locals.auth.validateUser()
	return { user }
}
