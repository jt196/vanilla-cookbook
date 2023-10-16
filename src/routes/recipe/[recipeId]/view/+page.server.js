import { error, redirect } from '@sveltejs/kit'

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
	let response = await fetch(`${url.origin}/api/recipe/${params.recipeId}`)
	const recipe = await response.json()
	if (recipe.is_public === false && (!session || !user)) {
		throw error(401, 'Unauthorized')
	}

	if (response.status === 403) {
		// Redirect to a specific route on a 403 response
		throw redirect(302, '/')
	}

	// Creating a dummy user object for non-logged in users
	let nullUser = {
		isAdmin: false,
		userId: null,
		units: 'metric',
		skipSmallUnits: false
	}

	let viewUser

	// Assigning the user or nullUser to the viewUser variable
	user ? (viewUser = user) : (viewUser = nullUser)

	let userId
	user ? (userId = user.userId) : null
	let viewMode = userId !== recipe.userId

	let recipeCategories = await fetch(`${url.origin}/api/recipe/categories/${params.recipeId}`)
	const categories = await recipeCategories.json()

	return {
		recipe,
		categories,
		viewMode,
		viewUser
	}
}
