import { error, redirect } from '@sveltejs/kit'

export const load = async ({ params, locals, fetch, url }) => {
	const user = locals.user

	let response = await fetch(`${url.origin}/api/recipe/${params.recipeId}`)
	if (!response.ok) throw error(response.status, 'Failed to load recipe')
	const recipe = await response.json()

	if (response.status === 403) {
		throw redirect(302, '/')
	}

	if (!recipe.is_public) {
		if (!user || (recipe.userId !== user.userId && !user.isAdmin)) {
			throw error(401, 'Unauthorized')
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
