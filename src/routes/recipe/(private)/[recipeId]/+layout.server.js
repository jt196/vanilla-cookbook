import { requireUser } from '$lib/server/authPage'
import { requireOwnership } from '$lib/server/authHelpers'

/**
 * Recipe edit pages: requires the logged-in user to own the recipe and provides it.
 *
 * @type {import('./$types').LayoutServerLoad}
 */
export const load = async ({ params, locals, fetch }) => {
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
