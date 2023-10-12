import { error } from '@sveltejs/kit'

// eslint-disable-next-line no-unused-vars
export const load = async ({ url, fetch, locals }) => {
	const { session, user } = await locals.auth.validateUser()
	console.log('🚀 ~ file: +page.server.js:6 ~ load ~ user:', user)

	if (!session || !user) {
		throw error(401, 'Unauthorized')
	}

	return { user }
}
