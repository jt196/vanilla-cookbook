import fs from 'fs/promises'
import path from 'path'
import { config } from 'dotenv'
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
} from './paprikaAPI.js'

// From the project root, run "node src/lib/utils/fetchPaprika.js recipes" to download recipes
// Check out the cases inside the switch statement to see what options you have
// They're download into the src/lib/data folder with their respective names e.g. recipes.json

config()

const email = process.env.PAPRIKA_EMAIL
const password = process.env.PAPRIKA_PASSWORD

if (!email || !password) {
	console.error('Please provide email and password in the .env file.')
	process.exit(1)
}

const fetchType = process.argv[2]

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
		console.error(
			'Please specify a valid argument (e.g., "categories", "recipes", "groceries", etc.).'
		)
		process.exit(1)
}

const outputPath = path.join(__dirname, '../data', outputFilename)

// Fetch from the Paprika API - will overwrite any existing files
fetchFunction(email, password)
	.then((data) => fs.writeFile(outputPath, JSON.stringify(data, null, 2)))
	.then(() => console.log(`Data saved to ${outputPath}`))
	.catch((error) => console.error(`Error fetching ${fetchType}:`, error))
