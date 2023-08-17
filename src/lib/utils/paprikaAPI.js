import fs from 'fs/promises'
import axios from 'axios'
import path from 'path'
import { fileURLToPath } from 'url'

const BASE_URL = 'https://www.paprikaapp.com/api/v1/sync/'

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

const download = async (uri, filename) => {
	const response = await axios.get(uri, { responseType: 'stream' })
	const writer = fs.createWriteStream(filename)
	response.data.pipe(writer)

	return new Promise((resolve, reject) => {
		writer.on('finish', resolve)
		writer.on('error', reject)
	})
}

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

export const saveRecipes = async (username, password, filename, photoDirectory) => {
	const recipes = await exportRecipes(username, password)

	await fs.writeFile(filename, JSON.stringify(recipes))

	console.log(`${recipes.length} recipes were saved.`)

	for (const recipe of recipes) {
		await download(recipe.photo_url, `${photoDirectory}/${recipe.uid}.jpg`)
	}
}

// Download the list of uids from the API, and grab the first recipe
// This has been written for testing purposes so I don't have to get them all!
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

// Grab the list of uids from the API, then grab each recipe's details
// Be careful when using as I don't know whether rate limits exist
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

// The recipe detail contains category UIDs - this will replace them with names
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

const categoriesFilePath = path.join(__dirname, '../data/categories.json')

// Download the categories to $lib/data/categories.json
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
