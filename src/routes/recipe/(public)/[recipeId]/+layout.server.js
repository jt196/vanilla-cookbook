import { error, redirect } from '@sveltejs/kit'

export const load = async ({ params, locals, fetch }) => {
	const user = locals.user
	const aiEnabled = locals.site?.ai?.enabled ?? false
	const semanticEnabled = locals.site?.semantic?.enabled ?? false

	const response = await fetch(`/api/recipe/${params.recipeId}`)
	if (response.status === 403) {
		throw redirect(302, '/')
	}
	if (!response.ok) {
		throw error(response.status, 'Failed to load recipe')
	}
	const recipe = await response.json()

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
		displayNutrition: true,
		ingSymbol: true,
		skipSmallUnits: true,
		showSimilarRecipes: true,
		showNotesDescription: false
	}

	// Using nullish coalescing operator to assign user or nullUser to viewUser
	const viewUser = user ?? nullUser

	// Optional chaining to safely access userId
	const userId = user?.userId
	const viewMode = userId !== recipe.userId
	const canViewLogs = !!user && (recipe.userId === user.userId || user.isAdmin)

	const recipeUserResponse = await fetch(`/api/user/${recipe.userId}/public`)
	const recipeLogsResponse = canViewLogs ? await fetch(`/api/recipe/${params.recipeId}/log`) : null

	const recUser = recipeUserResponse.ok ? await recipeUserResponse.json() : { userProfile: null }
	const logs = recipeLogsResponse?.ok ? await recipeLogsResponse.json() : []

	return {
		recipe,
		logs,
		viewMode,
		viewUser,
		recUser: recUser.userProfile ?? { username: 'Unknown user' },
		aiEnabled,
		semanticEnabled
	}
}
