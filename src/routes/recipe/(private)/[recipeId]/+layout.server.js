import { requireUser } from '$lib/server/authPage'
import { requireOwnership } from '$lib/server/authHelpers'

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
	const user = requireUser(locals)

	let recipeData = await fetch(`/api/recipe/${params.recipeId}`)
	const recipe = await recipeData.json()

	// Check if the user is logged in and if the recipe belongs to the user
	requireOwnership(user, recipe)

	return {
		recipe,
		allCategories: []
	}
}
