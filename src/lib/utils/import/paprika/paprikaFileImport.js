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
	// Load categories either from Paprika API, or local JSON at uploads/imports/categories.json
	const categories = await loadCategories()
	// If categories are successfully returned, add them to the DB
	if (categories && categories.length > 0) {
		await addCategoriesToDB(categories, userId)
	}

	const rawRecipes = await loadRecipes()
	await ensureCategoriesExist(rawRecipes, userId)
	const declaredRecipes = await declareRecipes(rawRecipes)
	const createdRecipes = await addRecipesToDB(declaredRecipes, userId)

	await addRecipeCategoriesToDB(createdRecipes, rawRecipes)
	await handlePhotosForRecipes(rawRecipes)
}
