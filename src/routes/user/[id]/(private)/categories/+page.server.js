import { fetchAndTransformCategories } from '$lib/utils/categories.js'

export const load = async ({}) => {
	const nodes = await fetchAndTransformCategories(fetch, url, user.userId)
	return { nodes }
}
