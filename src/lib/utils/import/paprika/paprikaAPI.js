/**
 * Utility script to fetch data from the Paprika API and save it to local JSON files.
 *
 * This script uses the Paprika API to fetch various types of data (e.g., recipes, categories, groceries)
 * and saves the fetched data as JSON files in the `uploads/imports` directory.
 *
 * Before running the script, ensure that the Paprika email and password are set in the `.env` file.
 *
 * @module paprikaAPI
 * @requires fs/promises
 * @requires path
 * @requires dotenv
 * @requires ./paprikaAPI.js
 */

import fs from 'fs/promises'
import path from 'path'
import {
	bookmarks,
	categories,
	groceries,
	meals,
	menus,
	menuItems,
	pantry,
	status,
	fetchDetailedRecipes,
	fetchFirstRecipeDetails,
	__dirname
} from './paprikaAPIUtils.js'

export async function fetchData(fetchType, email, password, userId) {
	// 1. Determine which function to call based on the fetchType provided
	let fetchFunction, outputFilename

	switch (fetchType) {
		case 'bookmarks':
			fetchFunction = bookmarks
			outputFilename = 'bookmarks.json'
			break
		case 'categories':
			fetchFunction = categories
			outputFilename = 'categories.json'
			break
		case 'groceries':
			fetchFunction = groceries
			outputFilename = 'groceries.json'
			break
		case 'meals':
			fetchFunction = meals
			outputFilename = 'meals.json'
			break
		case 'menus':
			fetchFunction = menus
			outputFilename = 'menus.json'
			break
		case 'menuItems':
			fetchFunction = menuItems
			outputFilename = 'menuItems.json'
			break
		case 'pantry':
			fetchFunction = pantry
			outputFilename = 'pantry.json'
			break
		case 'recipes':
			fetchFunction = fetchDetailedRecipes // Assign the function, don't call it
			outputFilename = 'recipes.json'
			break
		case 'firstRecipe':
			fetchFunction = fetchFirstRecipeDetails // Assign the function, don't call it
			outputFilename = 'firstRecipe.json'
			break
		case 'status':
			fetchFunction = status
			outputFilename = 'status.json'
			break
		default:
			console.error('Invalid fetchType provided:', fetchType)
			return // Simply return from the function
	}

	if (!fetchFunction || !outputFilename) {
		console.error(
			'Please specify a valid argument (e.g., "categories", "recipes", "groceries", etc.).'
		)
		return Promise.reject('Invalid fetchType provided') // Reject with an error message
	}

	// Use environment variable for docker container, otherwise, use the relative path
	const projectRoot = process.env.APP_ROOT_PATH || path.join(__dirname, '../../../../..')
	const outputPath = path.join(projectRoot, 'uploads/imports', `${userId}_${outputFilename}`)

	try {
		const data = await fetchFunction(email, password, userId)

		// 3. Write the resulting data to an appropriate file
		await fs.writeFile(outputPath, JSON.stringify(data, null, 2))
		console.log(`Data saved to ${outputPath}`)
		return Promise.resolve(`Data saved to ${outputPath}`) // Resolve with a success message
	} catch (error) {
		console.error(`Error fetching ${fetchType}:`, error)
		return Promise.reject(`Error fetching ${fetchType}: ${error.message}`) // Reject with an error message
	}
}
