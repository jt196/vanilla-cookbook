// eslint-disable-next-line no-unused-vars
export const load = async ({ url, fetch, locals }) => {
	// eslint-disable-next-line no-unused-vars
	const { session, user } = await locals.auth.validateUser()

	return { user }
}
