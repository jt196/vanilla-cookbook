import { error } from '@sveltejs/kit'

// eslint-disable-next-line no-unused-vars
export const load = async ({ url, fetch, locals }) => {
	const { session, user } = await locals.auth.validateUser()
	console.log('🚀 ~ file: +page.server.js:6 ~ load ~ user:', user)

	if (!session || !user) {
		throw error(401, 'Unauthorized')
	}

	let dbRecCount = 0
	try {
		const response = await fetch(`/api/user/${user.userId}/recipes/count`)
		const data = await response.json()
		if (data && data.count) {
			dbRecCount = data.count
		}
	} catch (err) {
		console.error('Error fetching recipe db count:', err)
		// You might want to handle this error differently based on your application's needs
	}

	return { user, dbRecCount }
}
