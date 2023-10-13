import { redirect } from '@sveltejs/kit'

/**
 * Server-side logic to load recipes for the page.
 * @returns {Promise<Object>} An object containing the recipes ordered by their creation date in descending order.
 */
export const load = async ({ url, fetch, locals }) => {
	const { session, user } = await locals.auth.validateUser()
	if (!session || !user) {
		throw redirect(302, '/login')
	}

	const recipeResponse = await fetch(`${url.origin}/api/user/${user.userId}/recipes`)
	const recipes = recipeResponse.json()
	const hierarchicalCategories = await fetch(`${url.origin}/api/user/${user.userId}/categories`)
	const categories = await hierarchicalCategories.json()

	return {
		recipes,
		categories
	}
}
