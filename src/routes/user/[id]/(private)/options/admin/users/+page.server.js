import { error } from '@sveltejs/kit'

export const load = async ({ url, fetch, locals }) => {
	// Fetch users
	const res = await fetch(`${url.origin}/api/user/admin/users`)

	if (!res.ok) {
		error(res.status, 'Failed to fetch users')
	}

	const users = await res.json()
	return { users }
}
