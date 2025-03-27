import {
	addCategoriesToDB,
	addRecipeCategoriesToDB,
	addRecipesToDB,
	declareRecipes,
	ensureCategoriesExist,
	filterExistingRecipes,
	handlePhotosForRecipes,
	loadCategories,
	loadRecipes
} from '$lib/utils/import/paprika/paprikaAPIUtils.js'

/**
 * Load categories and recipes from the Paprika API, or local JSON at uploads/imports/categories.json and uploads/imports/recipes.json and save them to the database.
 * @param {number} userId - The ID of the user whose data we are importing.
 */
export async function importPaprikaData(userId) {
	importPaprikaCategories(userId)
	importPaprikaRecipes(userId)
}

/**
 * Load categories from the Paprika API, or local JSON at uploads/imports/categories.json and save them to the database.
 * @param {number} userId - The ID of the user whose categories we are importing.
 */
export async function importPaprikaCategories(userId) {
	// Load categories either from Paprika API, or local JSON at uploads/imports/categories.json
	const categories = await loadCategories()
	// If categories are successfully returned, add them to the DB
	if (categories && categories.length > 0) {
		await addCategoriesToDB(categories, userId)
	}
}

/**
 * Imports recipes from a specified file into the database for a given user.
 *
 * This function loads recipes from a file, checks for duplicates against existing recipes,
 * and imports new recipes into the database. It ensures that categories exist in the database
 * and associates them with the recipes. Additionally, it handles the import of recipe photos.
 *
 * @param {number} userId - The ID of the user whose recipes are being imported.
 * @param {string} filename - The name of the file from which recipes will be loaded.
 * @param {boolean} [isPublic=false] - A flag indicating whether the imported recipes should be public.
 * @returns {Promise<Object>} An object containing the success status, a message, and the count of imported recipes.
 */
export async function importPaprikaRecipes(userId, filename, isPublic = false) {
	// Load recipes into memory from file
	// Nothing is stored locally here
	const rawRecipes = await loadRecipes(filename)
	if (rawRecipes.length === 0) {
		console.log('Error loading recipes.')
		return { success: false, message: 'There was an error loading your recipes!', count: 0 }
	}
	// Check against existing recipes using uids
	const newRecipes = await filterExistingRecipes(rawRecipes)
	// Return if they're already imported
	if (newRecipes.length === 0) {
		console.log('All recipes are already in the database.')
		return { success: true, message: 'All recipes are already in the database.', count: 0 }
	}
	// Check the recipe object for matching categories
	// Add them to the Category table in the DB if they don't exist
	await ensureCategoriesExist(newRecipes, userId)
	// Destructure the recipe data to remove any fields that don't exist on the recipe table
	const declaredRecipes = await declareRecipes(newRecipes, isPublic)
	// Add the destructured data to the DB
	const createdRecipes = await addRecipesToDB(declaredRecipes, userId)

	// Add the recipe categories to the RecipeCategory table
	await addRecipeCategoriesToDB(createdRecipes, newRecipes)
	// Add the photos to the DB too
	await handlePhotosForRecipes(newRecipes)
	return {
		success: true,
		message: `${newRecipes.length} recipes imported successfully!`,
		count: newRecipes.length
	}
}
