import { error } from '@sveltejs/kit'

/**
 * Handles loading the page data.
 *
 * @function
 * @async
 * @param {Object} context - The context of the load.
 * @param {Object} context.params - Parameters of the request.
 * @param {AppLocals} context.locals - The locals object.
 * @throws Will throw an error if unauthorized or the recipe is not found.
 * @returns {Promise<{ recipe: Object }>} The loaded recipe.
 */
export const load = async ({ url, params, locals, fetch }) => {
	const user = locals.user

	let recipeData = await fetch(`${url.origin}/api/recipe/${params.recipeId}`)
	const recipe = await recipeData.json()

	// Check if the user is logged in and if the recipe belongs to the user
	if (recipe.userId !== user.userId) {
		throw error(401, 'Unauthorized')
	}

	const hierarchicalCategories = await fetch(`${url.origin}/api/user/${user.userId}/categories`)
	const categories = await hierarchicalCategories.json()

	return {
		recipe,
		allCategories: categories
	}
}
