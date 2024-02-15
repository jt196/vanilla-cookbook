// eslint-disable-next-line no-unused-vars
export const load = async ({ locals }) => {
	try {
		const session = await locals.auth.validate()
		if (!session) {
			return { user: null }
		}
		const user = session?.user
		return { user }
	} catch (error) {
		console.error('Error validating session:', error)
		// Handle error appropriately, such as returning a minimal response or redirecting
		return { user: null }
	}
}
