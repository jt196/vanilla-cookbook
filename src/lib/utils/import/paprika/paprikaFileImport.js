import PrismaClientPkg from '@prisma/client'
import {
	addCategoriesToDB,
	loadCategories
} from '../src/lib/utils/import/paprika/paprikaAPIUtils.js/index.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { extractRecipes } from '../src/lib/utils/import/recipeImport.js'
import { savePhoto } from '../src/lib/utils/image/imageBackend.js'

// // Prisma doesn't support ES Modules so we have to do this
const PrismaClient = PrismaClientPkg.PrismaClient
// Different name of prismaC as the auth is importing prisma from the adapter
const prismaC = new PrismaClient()

const paprikaFile = process.env.PAPRIKA_IMPORT_FILE

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const uploadDir = path.join(__dirname, '../uploads') // Adjust the path to point to the root /static folder

// 6. Load Recipes
async function loadRecipes() {
	try {
		const recipesPath = path.join(__dirname, '../src/lib/data/import/', paprikaFile) // Adjust the filename
		let recipes = await extractRecipes(recipesPath)
		return recipes
	} catch (error) {
		console.error('Error loading recipes:', error.message)
		return []
	}
}

function getFileType(filename) {
	return filename.split('.').pop()
}

async function declareRecipes(rawRecipes) {
	return rawRecipes.map((recipe) => {
		// eslint-disable-next-line no-unused-vars
		const { categories, photo_data, photos, photo_url, photo, ...otherRecipeFields } = recipe
		return {
			...otherRecipeFields,
			created: new Date(otherRecipeFields.created)
		}
	})
}

async function addRecipesToDB(declaredRecipes, adminUserId) {
	const createdRecipes = []
	for (const recipe of declaredRecipes) {
		const createdRecipe = await prismaC.recipe.create({
			data: {
				...recipe,
				userId: adminUserId
			}
		})
		createdRecipes.push(createdRecipe)
	}
	return createdRecipes
}

// Parse a recipe object and create any categories that don't exist
async function ensureCategoriesExist(rawRecipes, adminUserId) {
	const allCategoriesFromRecipes = rawRecipes.flatMap((recipe) => recipe.categories)
	const uniqueCategories = [...new Set(allCategoriesFromRecipes)]

	const existingCategories = await prismaC.category.findMany({
		where: {
			name: {
				in: uniqueCategories
			}
		}
	})

	const existingCategoryNames = existingCategories.map((cat) => cat.name)
	const categoriesToCreate = uniqueCategories.filter(
		(catName) => !existingCategoryNames.includes(catName)
	)

	await Promise.all(
		categoriesToCreate.map((catName) => {
			return prismaC.category.create({
				data: {
					name: catName,
					userId: adminUserId
				}
			})
		})
	)

	return [...existingCategories, ...categoriesToCreate]
}

async function addRecipeCategoriesToDB(createdRecipes, rawRecipes) {
	for (const recipe of createdRecipes) {
		const originalRecipe = rawRecipes.find((raw) => raw.uid === recipe.uid)
		const categoryNames = originalRecipe.categories

		const categories = await prismaC.category.findMany({
			where: {
				name: {
					in: categoryNames
				}
			}
		})

		for (const category of categories) {
			await prismaC.recipeCategory.create({
				data: {
					recipeUid: recipe.uid,
					categoryUid: category.uid
				}
			})
		}
	}
}

async function handlePhotosForRecipes(createdRecipes) {
	for (const recipe of createdRecipes) {
		// Handle the main photo
		if (recipe.photo && recipe.photo_data) {
			await savePhoto(recipe.photo_data, recipe.photo, uploadDir)
			await prismaC.recipePhoto.create({
				data: {
					id: recipe.photo.split('.')[0],
					recipeUid: recipe.uid,
					isMain: true,
					fileType: getFileType(recipe.photo)
				}
			})
		}

		// Handle the photos array
		if (recipe.photos && recipe.photos.length > 0) {
			for (const photoObj of recipe.photos) {
				const { data: photoData, filename } = photoObj
				await savePhoto(photoData, filename, uploadDir)
				await prismaC.recipePhoto.create({
					data: {
						id: filename.split('.')[0],
						recipeUid: recipe.uid,
						fileType: getFileType(filename)
					}
				})
			}
		}

		// Handle the photo_url
		if (recipe.image_url) {
			await prismaC.recipePhoto.create({
				data: {
					recipeUid: recipe.uid,
					url: recipe.image_url
				}
			})
		}
	}
}

export async function importPaprikaData(userId) {
	// Load categories either from Paprika API, or local JSON at lib/data/import/categories.json
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
