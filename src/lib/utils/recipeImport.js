import PrismaClientPkg from '@prisma/client'
import { promises as fsPromises } from 'fs'
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
export async function importPaprikaCategories(recipes) {
	// Collecting all unique categories
	/** @type { Record<string, Category> } */
	const categoriesMap = {}

	recipes.forEach((recipe) => {
		recipe.categories &&
			recipe.categories.forEach((category) => {
				/** @type {Category} */
				const cat = category
				categoriesMap[cat.uid] = cat
			})
	})

	// Gather all unique parent UIDs
	const parentUids = new Set()

	Object.values(categoriesMap).forEach((category) => {
		if (category.parent_uid) {
			parentUids.add(category.parent_uid)
		}
	})

	// Create parent categories if they don't exist
	for (const parentUid of parentUids) {
		const existingCategory = await prismaC.category.findUnique({
			where: { uid: parentUid }
		})

		if (!existingCategory) {
			await prismaC.category.create({
				data: { uid: parentUid } // Only the UID is needed
			})
		}
	}

	// Creating or updating categories, connecting to parents if applicable
	for (const category of Object.values(categoriesMap)) {
		const existingCategory = await prismaC.category.findUnique({
			where: { uid: category.uid }
		})

		const categoryData = {
			uid: category.uid,
			order_flag: category.order_flag,
			name: category.name,
			parent: category.parent_uid
				? {
						connect: { uid: category.parent_uid }
				  }
				: undefined
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
