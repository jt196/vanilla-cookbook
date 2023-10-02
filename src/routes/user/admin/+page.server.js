import { error } from '@sveltejs/kit'

export const load = async ({ url, fetch, locals }) => {
	const { session, user } = await locals.auth.validateUser()

	if (!session || !user) {
		throw error(401, 'Unauthorized')
	}

	if (!user.isAdmin) {
		// Assuming 'isAdmin' is a field in your user object
		throw error(403, 'Forbidden')
	}

	// Fetch users
	const res = await fetch(`${url.origin}/api/user/users`)

	if (!res.ok) {
		throw error(res.status, 'Failed to fetch users')
	}

	const users = await res.json()
	console.log('🚀 ~ file: +page.server.js:23 ~ load ~ users:', users)

	return { users, adminId: user.userId }
}
