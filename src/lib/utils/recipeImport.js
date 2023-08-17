import PrismaClientPkg from '@prisma/client'
import { promises as fsPromises } from 'fs'
import { Open } from 'unzipper'
import path from 'path'
import fs from 'fs'

// Prisma doesn't support ES Modules so we have to do this
const PrismaClient = PrismaClientPkg.PrismaClient
// Different name of prismaC as the auth is importing prisma from the adapter
const prismaC = new PrismaClient()

/**
 * Loads Paprika recipes from a JSON file.
 *
 * @returns {Promise<PaprikaRecipe[]>} - An array of loaded Paprika recipes.
 */
export async function loadPaprikaRecipes() {
	const filePath = 'src/lib/data/recipes-small.json'

	if (!fs.existsSync(filePath)) {
		console.log('File does not exist:', filePath)
		return []
	}

	try {
		const jsonString = await fsPromises.readFile(filePath, 'utf8')
		return JSON.parse(jsonString)
	} catch (err) {
		console.log('An error occurred:', err)
		return []
	}
}

/**
 * Imports Paprika categories into the database.
 *
 * @param {PaprikaRecipe[]} recipes - An array of Paprika recipes containing category data.
 */

export async function importPaprikaCategories(recipes, userId) {
	// Collecting all unique categories
	/** @type { Record<string, Category> } */
	const categoriesMap = {}

	recipes.forEach((recipe) => {
		recipe.categories &&
			recipe.categories.forEach((category) => {
				categoriesMap[category.uid] = category

				// If the category has a parent_uid and it's not in the map, add it
				if (category.parent_uid && !categoriesMap[category.parent_uid]) {
					categoriesMap[category.parent_uid] = {
						order_flag: null,
						uid: category.parent_uid,
						parent_uid: null,
						name: '_unnamed'
					}
				}
			})
	})

	// First, create all parent categories
	for (const category of Object.values(categoriesMap)) {
		if (!category.parent_uid) {
			const existingCategory = await prismaC.category.findUnique({
				where: { uid: category.uid }
			})

			if (!existingCategory) {
				await prismaC.category.create({
					data: {
						uid: category.uid,
						order_flag: category.order_flag,
						name: category.name,
						userId: userId // Set the user ID here
					}
				})
			}
		}
	}

	// Then, create or update each child category
	for (const category of Object.values(categoriesMap)) {
		if (category.parent_uid) {
			const existingCategory = await prismaC.category.findUnique({
				where: { uid: category.uid }
			})

			// Update the category creation logic to include the user ID
			const categoryData = {
				uid: category.uid,
				userId: userId, // Set the user ID here
				order_flag: category.order_flag,
				name: category.name,
				parent_uid: category.parent_uid
			}

			if (existingCategory) {
				// Update if it exists
				await prismaC.category.update({
					where: { uid: category.uid },
					data: categoryData
				})
			} else {
				// Create if it doesn't exist
				await prismaC.category.create({
					data: categoryData
				})
			}
		}
	}
}

// Takes a .paprikarecipes file and returns a nested object of recipes
export async function extractRecipes(zipFilePath) {
	const recipes = []
	const cacheDir = path.join(path.dirname(zipFilePath), 'cache')

	// Ensure cache directory exists
	await fs.mkdir(cacheDir, { recursive: true })

	// Unzip the main .paprikarecipes file
	const directory = await Open.file(zipFilePath)

	for (const entry of directory.files) {
		if (entry.path.endsWith('.paprikarecipe')) {
			const recipeZipPath = path.join(cacheDir, entry.path)
			await entry.stream().pipe(fs.createWriteStream(recipeZipPath)).promise()

			const recipeZip = await Open.file(recipeZipPath)
			for (const recipeEntry of recipeZip.files) {
				if (!recipeEntry.path.includes('/')) {
					// Ensure it's a direct file, not in a sub-directory
					const recipeContent = await recipeEntry.buffer()
					const recipeJson = JSON.parse(recipeContent.toString('utf8'))
					recipes.push(recipeJson)
				}
			}

			// Remove the processed .paprikarecipe file
			await fs.unlink(recipeZipPath)
		}
	}

	// Optionally, remove the cache directory if it's empty
	await fs.rmdir(cacheDir).catch(() => {})

	return recipes
}

// export async function importPaprika(username, password) {
// await saveRecipes(
// 	username,
// 	password,
// 	'src/lib/data/recipes.json',
// 	'src/lib/recipes/_resources'
// );
// let recipes = await exportRecipes(username, password);
// await writeFile(`src/lib/data/recipes.json`, JSON.stringify(recipes));
// let recipes = await readFile('src/lib/data/recipes-small.json');
// recipes = unicodeToAscii(recipes);
// let recipes = await readFile('../../recipes/recipes.json');
// let recipeObj = JSON.parse(recipes);
// recipeObj = JSON.parse(JSON.stringify(recipes))
// console.log(recipes[0]);
// paprikaSave(recipeObj);
// }
