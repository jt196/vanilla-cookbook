import {
	addCategoriesToDB,
	addRecipeCategoriesToDB,
	addRecipesToDB,
	declareRecipes,
	ensureCategoriesExist,
	handlePhotosForRecipes,
	loadCategories,
	loadRecipes
} from '$lib/utils/import/paprika/paprikaAPIUtils.js'

export async function importPaprikaData(userId) {
	importPaprikaCategories(userId)
	importPaprikaRecipes(userId)
}

export async function importPaprikaCategories(userId) {
	// Load categories either from Paprika API, or local JSON at uploads/imports/categories.json
	const categories = await loadCategories()
	// If categories are successfully returned, add them to the DB
	if (categories && categories.length > 0) {
		await addCategoriesToDB(categories, userId)
	}
}

export async function importPaprikaRecipes(userId, filename) {
	// Load recipes into memory from file
	// Nothing is stored locally here
	const rawRecipes = await loadRecipes(filename)
	rawRecipes.forEach((recipe) => {
		console.log(`Name: ${recipe.name}, UID: ${recipe.uid}`)
	})
	// Check the recipe object for matching categories
	// Add them to the DB if they don't exist
	await ensureCategoriesExist(rawRecipes, userId)
	// Destructure the recipe data to remove any fields that don't exist on the recipe table
	const declaredRecipes = await declareRecipes(rawRecipes)
	// Add the destructured data to the DB
	const createdRecipes = await addRecipesToDB(declaredRecipes, userId)

	// Add the recipe categories to the RecipeCategory table
	await addRecipeCategoriesToDB(createdRecipes, rawRecipes)
	// Add the photos to the DB too
	await handlePhotosForRecipes(rawRecipes)
}
