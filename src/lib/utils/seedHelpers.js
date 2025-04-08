import { fail } from '@sveltejs/kit'
import * as fsPromise from 'fs/promises'
import fs from 'fs'
import csv from 'csv-parser'
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
	return !!(await prismaClient.siteSettings.findFirst())
}

export async function seedIngredients(prismaClient) {
	try {
		const folderPath = './src/lib/data/ingredients' // Specify the folder path

		const filePath = path.join(folderPath, 'dry_ingredient_data.csv')

		if (!fs.existsSync(filePath)) {
			console.log('dry_ingredient_data.csv not found, cannot continue seeding.')
			return
		}

		// Check the current version from SiteSettings
		const siteSettings = await prismaClient.siteSettings.findFirst()
		const currentVersion = siteSettings?.version || 0

		// Define the expected version
		const expectedVersion = 2.36 // Change this as needed

		// Proceed with seeding if currentVersion is less than expectedVersion
		if (currentVersion < expectedVersion) {
			// Clear the existing data in the Ingredient table
			await prismaClient.ingredient.deleteMany()

			// Read the CSV file using csv-parser with proper configuration
			const rows = []
			await new Promise((resolve, reject) => {
				fs.createReadStream(filePath)
					.pipe(csv({ separator: ',' })) // Specify the separator as a comma
					.on('data', (row) => {
						const name = row.name
						const gramsPerCup = parseFloat(row.gramsPerCup)

						// Add the data to the rows array
						rows.push({
							name: name,
							gramsPerCup: gramsPerCup
						})
					})
					.on('end', resolve)
					.on('error', reject)
			})

			// Begin the transaction
			await prismaClient.$transaction(
				rows.map((row) => prismaClient.ingredient.create({ data: row }))
			)

			console.log(`Data from ${filePath} has been seeded.`)

			// Update the version in SiteSettings
			await prismaClient.siteSettings.update({
				where: { id: siteSettings?.id || 1 },
				data: { version: expectedVersion }
			})

			console.log('All data has been seeded.')
		} else {
			console.log('Data is up to date. No need to seed.')
		}
	} catch (error) {
		console.error('Error seeding data:', error)
	}
}

export async function seedRecipes(adminUserId, prismaClient) {
	for (const recipe of recipes) {
		try {
			// Create the recipe record in the DB.
			const recipeRecord = await prismaClient.recipe.create({
				data: {
					uid: recipe.uid, // if you want to preserve the provided uid
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
					created: new Date(recipe.created),
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
						fileUrl,
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
