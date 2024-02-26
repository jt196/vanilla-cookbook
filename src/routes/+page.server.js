// eslint-disable-next-line no-unused-vars
export const load = async ({ locals }) => {
	let user = {}

	try {
		const session = await locals.auth.validate()
		if (session && session.user) {
			user = session.user
		}
	} catch (error) {
		console.error('Error validating session:', error)
	}

	return {
		user
	}
}
