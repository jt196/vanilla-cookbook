import { error } from '@sveltejs/kit'

export const load = async ({ url, fetch, locals }) => {
	const session = await locals.auth.validate()
	const user = session.user

	if (!session || !user) {
		throw error(401, 'Unauthorized')
	}

	if (!user.isAdmin) {
		// Assuming 'isAdmin' is a field in your user object
		throw error(403, 'Forbidden')
	}

	// Fetch users
	const res = await fetch(`${url.origin}/api/user/admin/users`)

	if (!res.ok) {
		throw error(res.status, 'Failed to fetch users')
	}

	const users = await res.json()
	return { users, adminId: user.userId }
}
