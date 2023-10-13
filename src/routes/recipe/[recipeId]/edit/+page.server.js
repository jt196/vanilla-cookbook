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
	const { user } = await locals.auth.validateUser()

	let recipeData = await fetch(`${url.origin}/api/recipe/${params.recipeId}`)
	const recipe = await recipeData.json()

	const hierarchicalCategories = await fetch(
		`${url.origin}/api/recipe/categories/user/${user.userId}`
	)
	const categories = await hierarchicalCategories.json()

	return {
		recipe,
		allCategories: categories
	}
}
