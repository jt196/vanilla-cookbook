import { fetchAndTransformCategories } from '$lib/utils/categories.js'

export const load = async ({ url, fetch }) => {
	const nodes = await fetchAndTransformCategories(fetch, url)
	return { nodes }
}
