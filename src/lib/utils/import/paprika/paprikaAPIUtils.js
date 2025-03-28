/**
 * Utility functions for fetching and processing data from the Paprika API.
 * @module paprikaAPI
 */
import axios from 'axios'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import { prisma } from '$lib/server/prisma'
import { extractRecipes } from '../recipeImport'
import { isValidRecipeStructure, saveFile } from '$lib/utils/import/files'
import { promises as fsPromises } from 'fs'
import { processImage } from '$lib/utils/image/imageBackend'

config()

const BASE_URL = 'https://www.paprikaapp.com/api/v1/sync/'
const __filename = fileURLToPath(import.meta.url)
export const __dirname = path.dirname(__filename)
export const appRootPath = process.env.APP_ROOT_PATH || path.join(__dirname, '../../../../..')

/**
 * Fetches data from the Paprika API for a given endpoint.
 * @param {string} endpoint - The Paprika API endpoint.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<Object>} - The data fetched from the API.
 */
const resource = async (endpoint, email, password) => {
	const options = {
		method: 'GET',
		baseURL: BASE_URL,
		url: endpoint,
		auth: {
			username: email,
			password: password
		},
		headers: {
			'User-Agent': 'PaprikaApi NodeJS library'
		}
	}

	const response = await axios(options)
	return response.data.result
}

/**
 * Fetches bookmarks from the Paprika API.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<Object>} - The bookmarks data fetched from the API.
 */
export const bookmarks = (email, password) => resource('bookmarks', email, password)
export const categories = (email, password) => resource('categories', email, password)
export const groceries = (email, password) => resource('groceries', email, password)
export const meals = (email, password) => resource('meals', email, password)
export const menus = (email, password) => resource('menus', email, password)
export const menuItems = (email, password) => resource('menuitems', email, password)
export const pantry = (email, password) => resource('pantry', email, password)
export const recipes = (email, password) => resource('recipes', email, password)
export const recipe = (recipeUid, email, password) =>
	resource('recipe/' + recipeUid, email, password)
export const status = (email, password) => resource('status', email, password)

/**
 * Downloads a file from a given URI and saves it to a specified filename.
 * @param {string} uri - The URI of the file to be downloaded.
 * @param {string} filename - The name of the file where the data will be saved.
 * @returns {Promise<void>}
 */
const download = async (uri, filename) => {
	const response = await axios.get(uri, { responseType: 'stream' })
	const writer = fsPromises.createWriteStream(filename)
	response.data.pipe(writer)

	return new Promise((resolve, reject) => {
		writer.on('finish', resolve)
		writer.on('error', reject)
	})
}

/**
 * Downloads an image from a given URL and returns it as a buffer.
 *
 * @param {string} url - The URL of the image to download.
 * @returns {Promise<Buffer>} A promise that resolves with the downloaded image as a buffer.
 */
export async function downloadImageAsBuffer(url) {
	const response = await axios.get(url, {
		responseType: 'arraybuffer'
	})
	return Buffer.from(response.data)
}

/**
 * Exports recipes from the Paprika API.
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @returns {Promise<Array>} - An array of detailed recipes.
 */
export const exportRecipes = async (username, password) => {
	const recipesList = await recipes(username, password)
	const categoriesList = await categories(username, password)

	const categoryHash = categoriesList.reduce(
		(hash, category) => ({
			...hash,
			[category.uid]: category
		}),
		{}
	)

	const recipesDetails = await Promise.all(
		recipesList.map((r) => recipe(r.uid, username, password))
	)

	return recipesDetails.map((recipeDetail) => ({
		...recipeDetail,
		categories: recipeDetail.categories.map((uid) => categoryHash[uid])
	}))
}

/**
 * Saves recipes to a specified file and downloads their photos.
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @param {string} filename - The name of the file where recipes will be saved.
 * @param {string} photoDirectory - The directory where recipe photos will be saved.
 * @returns {Promise<void>}
 */
export const saveRecipes = async (username, password, filename, photoDirectory) => {
	const recipes = await exportRecipes(username, password)

	await fsPromises.writeFile(filename, JSON.stringify(recipes))

	console.log(`${recipes.length} recipes were saved.`)

	for (const recipe of recipes) {
		await download(recipe.photo_url, `${photoDirectory}/${recipe.uid}.jpg`)
	}
}

/**
 * Fetches details of the first recipe from the Paprika API.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<Array>} - An array containing details of the first recipe.
 */
export const fetchFirstRecipeDetails = async (email, password, userId) => {
	const recipeList = await recipes(email, password)
	if (recipeList.length === 0) {
		throw new Error('No recipes found.')
	}

	const firstRecipe = recipeList[0]
	let detailedRecipe = await recipe(firstRecipe.uid, email, password)
	// Replace the uids with names
	detailedRecipe = await replaceCategoryUIDsWithNames(detailedRecipe, email, password, userId)

	return [detailedRecipe]
}

/**
 * Fetches detailed recipes from the Paprika API.
 * Be careful when using as I don't know whether rate limits exist
 * Grab the list of uids from the API, then grab each recipe's details
 *
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<Array>} - An array of detailed recipes.
 */
export const fetchDetailedRecipes = async (email, password, userId) => {
	const recipeList = await recipes(email, password)
	const detailedRecipes = []

	// Loop through only the first 10 items of recipeList
	// for (let i = 0; i < Math.min(10, recipeList.length); i++) {
	for (let i = 0; i < recipeList.length; i++) {
		const r = recipeList[i]
		let detailedRecipe = await recipe(r.uid, email, password)

		// Replace the uids with names
		detailedRecipe = await replaceCategoryUIDsWithNames(detailedRecipe, email, password, userId)
		detailedRecipes.push(detailedRecipe)
	}

	return detailedRecipes
}

/**
 * Replaces category UIDs in a recipe with their respective names.
 * @param {Object} recipe - The recipe object containing category UIDs.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<Object>} - The updated recipe with category names.
 */
const replaceCategoryUIDsWithNames = async (recipe, email, password, userId) => {
	const categoriesList = await getCategories(email, password, userId)
	const categoryMap = categoriesList.reduce((acc, category) => {
		acc[category.uid] = category.name
		return acc
	}, {})

	const updatedRecipe = { ...recipe }
	updatedRecipe.categories = recipe.categories.map((uid) => categoryMap[uid] || uid)

	return updatedRecipe
}

/**
 * Downloads categories from the Paprika API and saves them to lib/data/categories.json
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<Array>} - An array of categories.
 */
const getCategories = async (email, password, userId) => {
	const categoriesFilePath = path.join(appRootPath, `uploads/imports/${userId}_categories.json`)

	try {
		console.log('Accessing the local categories!')
		await fsPromises.access(categoriesFilePath)
		const categoriesData = await fsPromises.readFile(categoriesFilePath, 'utf-8')
		return JSON.parse(categoriesData)
	} catch (error) {
		const fetchedCategories = await categories(email, password)
		await fsPromises.writeFile(categoriesFilePath, JSON.stringify(fetchedCategories, null, 2))
		return fetchedCategories
	}
}

/**
 * 1. Loads categories from a specified file path.
 * Tries to access and read the file, parsing its contents as JSON.
 * If the file does not exist or an error occurs during reading,
 * logs the error and returns an empty array.
 *
 * @param {string} filepath - The path to the categories file.
 * @returns {Promise<Array>} - A promise that resolves to an array of categories,
 *                             or an empty array if the file cannot be accessed or read.
 */
export async function loadCategories(filepath) {
	try {
		// This will throw an error if the file does not exist or is inaccessible
		await fsPromises.access(filepath)

		// If there's no error, we can read the file
		const data = await fsPromises.readFile(filepath, 'utf-8')
		return JSON.parse(data)
	} catch (error) {
		if (error.code === 'ENOENT') {
			console.log("Categories file doesn't exist!")
			// return await getCategories(email, password);
		} else {
			console.error('Error loading categories:', error.message)
		}
		return []
	}
}

/**
 * Loads recipes from a given filename, which can be either a .json file or a .paprikarecipes archive.
 * If the file is a .json file, it is parsed as JSON. If it is a .paprikarecipes archive,
 * it is extracted using the extractRecipes function.
 * The recipes structure is then validated using the isValidRecipeStructure function.
 * If the recipes structure is invalid, an error is thrown.
 * If there is an error loading the recipes, an error is logged to the console and an empty array is returned.
 * @param {string} filename - The name of the file to load recipes from.
 * @returns {Promise<Array>} - The loaded recipes, or an empty array if there was an error.
 */
export async function loadRecipes(filename) {
	try {
		const recipesPath = path.join(appRootPath, 'uploads/imports', filename)
		let recipes

		if (filename.endsWith('.paprikarecipes')) {
			recipes = await extractRecipes(recipesPath)
		} else if (filename.endsWith('.json')) {
			const content = await fsPromises.readFile(recipesPath, 'utf-8')
			recipes = JSON.parse(content)
		} else {
			throw new Error('Unsupported file type.')
		}

		// Validate the recipes structure
		if (!isValidRecipeStructure(recipes)) {
			throw new Error('Invalid recipe structure.')
		}

		return recipes
	} catch (error) {
		console.error('Error loading recipes:', error.message)
		return []
	}
}

/**
 * 2. Adds categories to the database.
 * @param {Array} categories - An array of categories to be added.
 * @param {string} userId - The user's ID.
 * @returns {Promise<void>}
 */
export async function addCategoriesToDB(categories, userId) {
	// Separate out top-level parents
	const topLevelParents = categories.filter((cat) => cat.parent_uid === null)
	const childCategories = categories.filter((cat) => cat.parent_uid !== null)

	// Insert top-level parents first
	for (const category of topLevelParents) {
		await prisma.category.upsert({
			where: { uid: category.uid },
			update: { ...category, userId: userId },
			create: { ...category, userId: userId }
		})
	}

	// Keep track of categories that have been processed
	let processedUids = new Set(topLevelParents.map((cat) => cat.uid))

	// While there are still child categories to process
	while (childCategories.length > 0) {
		for (let i = 0; i < childCategories.length; i++) {
			const category = childCategories[i]
			if (processedUids.has(category.parent_uid)) {
				await prisma.category.upsert({
					where: { uid: category.uid },
					update: { ...category, userId: userId },
					create: { ...category, userId: userId }
				})
				processedUids.add(category.uid)
				childCategories.splice(i, 1) // Remove the processed category
				i-- // Adjust the index since we've modified the array
			}
		}
	}
}

/**
 * Adds recipes to the database.
 * @param {Array} declaredRecipes - An array of declared recipes (i.e. recipes
 * stripped of any fields that don't exist on the recipe table in the DB).
 * @param {string} userId - The user's ID.
 * @returns {Promise<Array>} - An array of created recipes.
 */
export async function addRecipesToDB(declaredRecipes, userId) {
	const createdRecipes = []
	for (const recipe of declaredRecipes) {
		// TODO: $transaction this
		const createdRecipe = await prisma.recipe.create({
			data: {
				...recipe,
				userId: userId
			}
		})
		createdRecipes.push(createdRecipe)
	}
	return createdRecipes
}

/**
 * Handles all of the photo-related processing for recipes that have been added to the database.
 * This includes:
 * - Saving the main photo to the uploads directory
 * - Creating a RecipePhoto record for the main photo
 * - Handling the photos array by saving each photo to the uploads directory and creating a RecipePhoto record
 * - If the recipe is in .json format, downloading the photo from the photo_url field
 * - If all of the above haven't managed to grab an image, downloading it from the image_url field
 * @param {Array} createdRecipes - An array of created recipes.
 * @returns {Promise<void>}
 */
export async function handlePhotosForRecipes(createdRecipes) {
	const uploadDir = path.join(appRootPath, 'uploads/images')

	const failedRecipes = []

	for (const recipe of createdRecipes) {
		// TODO: $transaction
		try {
			let isMainSet = false

			// Handle the main photo in Base64 format
			if (recipe.photo && recipe.photo_data) {
				await saveFile(recipe.photo_data, recipe.photo, uploadDir)
				isMainSet = true
				await prisma.recipePhoto.create({
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
					await saveFile(photoData, filename, uploadDir)
					let setMain = false
					!isMainSet ? ((setMain = true), (isMainSet = true)) : null
					await prisma.recipePhoto.create({
						data: {
							id: filename.split('.')[0],
							recipeUid: recipe.uid,
							fileType: getFileType(filename),
							isMain: setMain
						}
					})
				}
			}

			// If the recipe is in .json format download the photo
			if (recipe.photo_url && !isMainSet && recipe.photo) {
				console.log('Grabbing photo from recipe.photo_url: ' + recipe.name)
				let filename = recipe.photo.split('.')[0]
				let filetype = getFileType(recipe.photo)
				let photoUrlSuccess = await processImage(recipe.photo_url, filename, filetype)
				photoUrlSuccess ? ((isMainSet = true), console.log('photo_url grab successful!')) : null
				if (photoUrlSuccess) {
					await prisma.recipePhoto.create({
						data: {
							id: filename,
							recipeUid: recipe.uid,
							fileType: filetype,
							isMain: isMainSet
						}
					})
				}
			}
			// If all of the above still haven't managed to grab an image, download it from the image_url field
			if (recipe.image_url && !isMainSet) {
				console.log('Grabbing photo from recipe.image_url: ' + recipe.name)
				const url = new URL(recipe.image_url)
				const pathname = url.pathname
				let filetype = getFileType(pathname)
				isMainSet = true
				let recipePhoto = await prisma.recipePhoto.create({
					data: {
						recipeUid: recipe.uid,
						fileType: filetype,
						isMain: isMainSet
					}
				})
				let imageUrlSuccess = await processImage(recipe.image_url, recipePhoto.id, filetype)
				imageUrlSuccess ? ((isMainSet = true), console.log('image_url grab successful!')) : null
				if (!imageUrlSuccess) {
					// Delete the preliminary record if the processImage function fails
					await prisma.recipePhoto.delete({
						where: {
							id: recipePhoto.id
						}
					})
				}
			}
		} catch (error) {
			console.error(`Failed to process recipe with UID ${recipe.uid}:`, error)
			failedRecipes.push(recipe.uid)
		}
	}
	if (failedRecipes.length > 0) {
		console.warn(`Failed to process recipes with UIDs: ${failedRecipes.join(', ')}`)
	}
}

/**
 * Adds categories to recipes in the database.
 * @param {Array} createdRecipes - An array of created recipes.
 * @param {Array} rawRecipes - An array of raw recipes.
 */
export async function addRecipeCategoriesToDB(createdRecipes, rawRecipes) {
	for (const recipe of createdRecipes) {
		const originalRecipe = rawRecipes.find((raw) => raw.uid === recipe.uid)
		const categoryNames = originalRecipe.categories

		const categories = await prisma.category.findMany({
			where: {
				name: {
					in: categoryNames
				}
			}
		})
		// TODO: $transaction this rather than running many adds
		for (const category of categories) {
			await prisma.recipeCategory.create({
				data: {
					recipeUid: recipe.uid,
					categoryUid: category.uid
				}
			})
		}
	}
}

/**
 * Parse a recipe object and create any categories that don't exist
 * Ensures that all categories from the raw recipes exist in the database.
 * @param {Array} rawRecipes - An array of raw recipes.
 * @param {string} adminUserId - The ID of the admin user to create the categories under.
 * @returns {Promise<Array>} A promise that resolves to an array of all categories, both existing
 * and newly created.
 */
export async function ensureCategoriesExist(rawRecipes, adminUserId) {
	const allCategoriesFromRecipes = rawRecipes.flatMap((recipe) => recipe.categories)
	const uniqueCategories = [...new Set(allCategoriesFromRecipes)]

	const existingCategories = await prisma.category.findMany({
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
			return prisma.category.create({
				data: {
					name: catName,
					userId: adminUserId
				}
			})
		})
	)

	return [...existingCategories, ...categoriesToCreate]
}

/**
 * Extracts the file extension from a given filename.
 *
 * @param {string} filename - The name of the file to extract the extension from.
 * @returns {string} - The file extension.
 */

/**
 * Extracts the file extension from a given filename.
 *
 * @param {string} filename - The name of the file to extract the extension from.
 * @returns {string} - The file extension.
 */
export function getFileType(filename) {
	return filename.split('.').pop()
}

/**
 * Takes an array of raw recipes and returns a new array with the recipe fields
 * remapped to match the columns in the Recipe table.
 * @param {Array} rawRecipes - The array of raw recipes.
 * @param {boolean} isPublic - Whether the recipes should be marked as public.
 * @returns {Promise<Array>} A promise that resolves to an array of remapped recipe objects.
 */
export async function declareRecipes(rawRecipes, isPublic) {
	return rawRecipes.map((recipe) => {
		// eslint-disable-next-line no-unused-vars
		const { categories, photo_data, photos, photo_url, photo, ...otherRecipeFields } = recipe
		return {
			...otherRecipeFields,
			created: new Date(otherRecipeFields.created),
			is_public: isPublic
		}
	})
}

/**
 * Reads a JSON file and returns the length of the array stored in the file. If the file
 * does not exist, or if the file is not a valid JSON file, or if the JSON content is not
 * an array, returns null. If the file is empty, returns 0.
 *
 * @param {string} filePath - The path to the JSON file.
 * @returns {Promise<number | null>} A promise that resolves to the length of the array
 * stored in the file, or null if the file does not exist or is malformed.
 */
export async function getJSONLength(filePath) {
	try {
		const data = await fsPromises.readFile(filePath, 'utf-8')
		const jsonContent = JSON.parse(data)

		// If the JSON content is an array, return its length. Otherwise, return null.
		if (Array.isArray(jsonContent)) {
			return jsonContent.length
		} else {
			console.error('Expected an array in the JSON file.')
			return null
		}
	} catch (err) {
		if (err.code === 'ENOENT') {
			// File not found
			return 0
		}
		console.error('Error reading or parsing the file:', err)
		return null
	}
}

/**
 * Filters out recipes that already exist in the database from a given array of raw recipes.
 *
 * This function takes an array of raw recipe objects and checks their unique identifiers (UIDs)
 * against those stored in the database. It returns a new array containing only the recipes
 * that are not already present in the database.
 *
 * @param {Array} rawRecipes - An array of raw recipe objects, each containing a unique identifier (UID).
 * @returns {Promise<Array>} A promise that resolves to an array of recipes that do not exist in the database.
 */
export async function filterExistingRecipes(rawRecipes) {
	// Extract UIDs from rawRecipes
	const uidsToCheck = rawRecipes.map((recipe) => recipe.uid)

	// Query the database for recipes with matching UIDs
	const existingRecipes = await prisma.recipe.findMany({
		where: {
			uid: {
				in: uidsToCheck
			}
		},
		select: {
			uid: true
		}
	})

	// Extract UIDs of existing recipes
	const existingUids = existingRecipes.map((recipe) => recipe.uid)

	// Filter out recipes from rawRecipes that exist in the database
	const newRecipes = rawRecipes.filter((recipe) => !existingUids.includes(recipe.uid))

	return newRecipes
}
