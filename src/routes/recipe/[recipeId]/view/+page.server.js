import { error, redirect } from '@sveltejs/kit'

export const load = async ({ params, locals, fetch, url }) => {
	const session = await locals.auth.validate()
	const user = session?.user

	let response = await fetch(`${url.origin}/api/recipe/${params.recipeId}`)
	const recipe = await response.json()

	// Check if recipe is not public and no session or user is available
	if (!recipe.is_public && (!session || !user)) {
		error(401, 'Unauthorized');
	}

	if (response.status === 403) {
		// Redirect to a specific route on a 403 response
		redirect(302, '/');
	}

	// Creating a dummy user object for non-logged in users
	const nullUser = {
		isAdmin: false,
		userId: null,
		units: 'metric',
		skipSmallUnits: false
	}

	// Using nullish coalescing operator to assign user or nullUser to viewUser
	const viewUser = user ?? nullUser

	// Optional chaining to safely access userId
	const userId = user?.userId
	const viewMode = userId !== recipe.userId

	let recipeCategories = await fetch(`${url.origin}/api/recipe/categories/${params.recipeId}`)
	let recipeLogs = await fetch(`${url.origin}/api/recipe/${params.recipeId}/log`)
	const categories = await recipeCategories.json()
	const logs = await recipeLogs.json()

	return {
		recipe,
		logs,
		categories,
		viewMode,
		viewUser
	}
}
