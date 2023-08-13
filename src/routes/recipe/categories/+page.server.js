import { transformToNodes } from '$lib/utils/categories.js'

export const load = async ({ url, fetch }) => {
	const catRes = await fetch(`${url.origin}/api/recipe/categories`)
	const categories = await catRes.json()

	const myNodes = await transformToNodes(categories)

	return { myNodes }
}
