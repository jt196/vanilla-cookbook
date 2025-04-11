import { error, redirect } from '@sveltejs/kit'

export const load = async ({ params, locals, fetch, url }) => {
	const session = await locals.auth.validate()
	const user = session?.user

	let response = await fetch(`${url.origin}/api/recipe/${params.recipeId}`)
	const recipe = await response.json()

	if (response.status === 403) {
		// Redirect to a specific route on a 403 response
		redirect(302, '/')
	}

	// If recipe is not public
	// Check whether user is logged in, and whether user is owner of recipe or admin
	if (!recipe.is_public) {
		if (!user || (recipe.userId !== user.userId && !user.isAdmin)) {
			error(401, 'Unauthorized')
		}
	}

	// Creating a dummy user object for non-logged in users
	const nullUser = {
		isAdmin: false,
		isRoot: false,
		userId: null,
		units: 'metric',
		language: 'eng',
		ingMatch: false,
		ingOriginal: false,
		ingExtra: false,
		useCats: false,
		ingSymbol: true,
		skipSmallUnits: true
	}

	// Using nullish coalescing operator to assign user or nullUser to viewUser
	const viewUser = user ?? nullUser

	// Optional chaining to safely access userId
	const userId = user?.userId
	const viewMode = userId !== recipe.userId

	let recipeCatsResponse = await fetch(`${url.origin}/api/recipe/categories/${params.recipeId}`)
	let recipeLogsResponse = await fetch(`${url.origin}/api/recipe/${params.recipeId}/log`)
	let recipeUserResponse = await fetch(`${url.origin}/api/user/${recipe.userId}/public`)
	const categories = await recipeCatsResponse.json()
	const recUser = await recipeUserResponse.json()
	const logs = await recipeLogsResponse.json()

	return {
		recipe,
		logs,
		categories,
		viewMode,
		viewUser,
		recUser: recUser.userProfile
	}
}
