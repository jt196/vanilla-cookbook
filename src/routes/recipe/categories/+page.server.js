import { fetchAndTransformCategories } from '$lib/utils/categories.js'

export const load = async ({ url, fetch }) => {
	const myNodes = await fetchAndTransformCategories(fetch, url)
	return { myNodes }
}
