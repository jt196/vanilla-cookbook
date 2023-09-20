import { error } from '@sveltejs/kit'

/**
 * Loads the recipe data.
 *
 * @function load
 * @param {Object} context - The loading context.
 * @param {Object} context.params - The route parameters.
 * @param {AppLocals} context.locals - The local variables.
 * @returns {Promise<Object>} The loaded recipe data.
 * @async
 */
export const load = async ({ params, locals, fetch, url }) => {
	const { session, user } = await locals.auth.validateUser()
	if (!session || !user) {
		throw error(401, 'Unauthorized')
	}

	let recipeCategories = await fetch(`${url.origin}/api/recipe/categories/${params.recipeId}`)
	const categories = await recipeCategories.json()
	console.log('🚀 ~ file: +page.server.js:21 ~ load ~ categories:', categories)
	let recipeData = await fetch(`${url.origin}/api/recipe/${params.recipeId}`)
	const recipe = await recipeData.json()

	return {
		recipe,
		categories
	}
}
