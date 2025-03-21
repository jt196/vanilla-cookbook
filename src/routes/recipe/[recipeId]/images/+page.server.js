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
	const session = await locals.auth.validate()
	const user = session?.user
	if (!session || !user) {
		error(401, 'Unauthorized');
	}

	let recipeData = await fetch(`${url.origin}/api/recipe/${params.recipeId}`)
	const recipe = await recipeData.json()

	return {
		recipe
	}
}
