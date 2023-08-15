import { fetchAndTransformCategories } from '$lib/utils/categories.js'
import { error } from '@sveltejs/kit'

export const load = async ({ url, fetch, locals }) => {
	const { session, user } = await locals.auth.validateUser()
	if (!session || !user) {
		throw error(401, 'Unauthorized')
	}
	const nodes = await fetchAndTransformCategories(fetch, url, user.userId)
	return { nodes, userId: user.userId }
}
