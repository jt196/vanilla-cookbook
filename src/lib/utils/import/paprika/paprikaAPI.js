/**
 * Utility functions for fetching and processing data from the Paprika API.
 * @module paprikaAPI
 */

import { promises as fs } from 'fs'
import axios from 'axios'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import PrismaClientPkg from '@prisma/client'

config()

const BASE_URL = 'https://www.paprikaapp.com/api/v1/sync/'
const email = process.env.PAPRIKA_EMAIL
const password = process.env.PAPRIKA_PASSWORD

// // Prisma doesn't support ES Modules so we have to do this
const PrismaClient = PrismaClientPkg.PrismaClient
// Different name of prismaC as the auth is importing prisma from the adapter
const prismaC = new PrismaClient()

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
	const writer = fs.createWriteStream(filename)
	response.data.pipe(writer)

	return new Promise((resolve, reject) => {
		writer.on('finish', resolve)
		writer.on('error', reject)
	})
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

	await fs.writeFile(filename, JSON.stringify(recipes))

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
export const fetchFirstRecipeDetails = async (email, password) => {
	const recipeList = await recipes(email, password)
	if (recipeList.length === 0) {
		throw new Error('No recipes found.')
	}

	const firstRecipe = recipeList[0]
	let detailedRecipe = await recipe(firstRecipe.uid, email, password)
	// Replace the uids with names
	detailedRecipe = await replaceCategoryUIDsWithNames(detailedRecipe, email, password)

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
export const fetchDetailedRecipes = async (email, password) => {
	const recipeList = await recipes(email, password)
	const detailedRecipes = []

	for (const r of recipeList) {
		let detailedRecipe = await recipe(r.uid, email, password)
		// Replace the uids with names
		detailedRecipe = await replaceCategoryUIDsWithNames(detailedRecipe, email, password)
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
const replaceCategoryUIDsWithNames = async (recipe, email, password) => {
	const categoriesList = await getCategories(email, password)
	const categoryMap = categoriesList.reduce((acc, category) => {
		acc[category.uid] = category.name
		return acc
	}, {})

	const updatedRecipe = { ...recipe }
	updatedRecipe.categories = recipe.categories.map((uid) => categoryMap[uid] || uid)

	return updatedRecipe
}

const __filename = fileURLToPath(import.meta.url)
export const __dirname = path.dirname(__filename)

const categoriesFilePath = path.join(__dirname, '../../../data/categories.json')

/**
 * Downloads categories from the Paprika API and saves them to lib/data/categories.json
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<Array>} - An array of categories.
 */
const getCategories = async (email, password) => {
	try {
		await fs.access(categoriesFilePath)
		const categoriesData = await fs.readFile(categoriesFilePath, 'utf-8')
		return JSON.parse(categoriesData)
	} catch (error) {
		const fetchedCategories = await categories(email, password)
		await fs.writeFile(categoriesFilePath, JSON.stringify(fetchedCategories, null, 2))
		return fetchedCategories
	}
}

/**
 * 1. Loads categories either from a local file or fetches them from the API.
 * @returns {Promise<Array>} - An array of categories.
 */
export async function loadCategories() {
	try {
		if (await fs.access(categoriesFilePath)) {
			const data = await fs.readFile(categoriesFilePath, 'utf-8')
			return JSON.parse(data)
		} else {
			return await getCategories(email, password)
		}
	} catch (error) {
		console.error('Error loading categories:', error.message)
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
		await prismaC.category.upsert({
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
				await prismaC.category.upsert({
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
