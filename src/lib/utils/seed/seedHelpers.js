import * as fsPromise from 'fs/promises'
import path from 'path'

import { createRecipePhotoEntry } from '$lib/utils/api.js'
import { recipes } from '$lib/data/import/recipes.js'
import { processImage } from '$lib/utils/image/imageBackend'

/**
 * Checks if the SQLite database file exists in the specified path.
 *
 * @async
 * @function
 * @returns {Promise<boolean>} A promise that resolves to true if the database file exists, otherwise false.
 */
export async function dbExists() {
	const dbPath = path.join(process.cwd(), 'prisma', 'db', 'dev.sqlite')
	let dbExists = false
	try {
		await fsPromise.access(dbPath)
		dbExists = true
	} catch (e) {
		console.error('🚀 ~ dbExists ~ e:', e)
		dbExists = false
	}
	return dbExists
}

/**
 * Checks if the database has been seeded by verifying the existence of site settings.
 *
 * @async
 * @function
 * @param {PrismaClient} prismaClient - The Prisma client instance to interact with the database.
 * @returns {Promise<boolean>} A promise that resolves to true if the site settings exist, indicating the database has been seeded, otherwise false.
 */
export async function dbSeeded(prismaClient) {
	const db = await dbExists()
	if (!db) return false
	return !!(await prismaClient.authUser.findFirst())
}

/**
 * Seeds the database with predefined recipes for a given admin user.
 *
 * This function iterates over the predefined `recipes` array, inserting each recipe
 * into the database associated with the provided admin user ID. For each recipe, it also
 * attempts to create entries for any associated photos and processes the images.
 *
 * @async
 * @function
 * @param {string} adminUserId - The ID of the admin user to associate the recipes with.
 * @param {PrismaClient} prismaClient - The Prisma client instance used for database operations.
 */
export async function seedRecipes(adminUserId, prismaClient) {
	for (const recipe of recipes) {
		try {
			// Create the recipe record in the DB.
			const recipeRecord = await prismaClient.recipe.create({
				data: {
					userId: adminUserId,
					rating: recipe.rating,
					photo_hash: recipe.photo_hash,
					on_favorites: recipe.on_favorites,
					photo: recipe.photo,
					scale: recipe.scale,
					ingredients: recipe.ingredients,
					is_pinned: recipe.is_pinned,
					is_public: recipe.is_public,
					source: recipe.source,
					total_time: recipe.total_time,
					hash: recipe.hash,
					description: recipe.description,
					source_url: recipe.source_url,
					difficulty: recipe.difficulty,
					on_grocery_list: recipe.on_grocery_list,
					in_trash: recipe.in_trash,
					directions: recipe.directions,
					photo_url: recipe.photo_url,
					cook_time: recipe.cook_time,
					name: recipe.name,
					created: new Date(),
					notes: recipe.notes,
					photo_large: recipe.photo_large,
					image_url: recipe.image_url,
					prep_time: recipe.prep_time,
					servings: recipe.servings,
					nutritional_info: recipe.nutritional_info
				}
			})

			// Loop through each photo in the recipe's photos array.
			if (recipe.photos && recipe.photos.length > 0) {
				for (const photo of recipe.photos) {
					// Use the photo's id and fileType to form the file name.
					const photoId = photo.id
					const fileType = photo.fileType // e.g., "jpg"
					// Build the local path to the dummy image.
					const localPhotoPath = path.join(
						process.cwd(),
						'src',
						'lib',
						'data',
						'images',
						`${photoId}.${fileType}`
					)

					// Check that the file exists before processing.
					try {
						await fsPromise.access(localPhotoPath)
					} catch (error) {
						console.error(
							`Photo file not found at ${localPhotoPath}. Skipping this photo for recipe ${recipeRecord.uid}.`
						)
						continue
					}

					// Convert the local file path to a file URL if needed.
					const fileUrl = `file://${localPhotoPath}`

					// Create the recipe photo entry using your helper function.
					const photoEntry = await createRecipePhotoEntry(
						recipeRecord.uid,
						photo.url,
						fileType,
						photo.isMain
					)
					// Process the image (download/resize etc.)
					const processed = await processImage(fileUrl, photoEntry.id, fileType)
					if (!processed) {
						console.error(
							`Image processing failed for photo ${photoId} in recipe ${recipeRecord.uid}`
						)
					}
				}
			}
		} catch (error) {
			console.error('Error seeding recipe:', recipe.name, error)
		}
	}
}
