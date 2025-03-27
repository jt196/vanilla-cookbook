import { manipulateIngredient } from './converter'
import { shouldSkipConversion } from './units'
import { prisma } from '$lib/server/prisma'
import Fuse from 'fuse.js'

/**
 * Retrieves all ingredient data from the database.
 *
 * @returns {Promise<Object[]>} A promise that resolves to an array of ingredient objects from the database.
 */
async function getAllIngredientData() {
	const ingredientData = await prisma.ingredient.findMany()
	return ingredientData
}

/**
 * Converts a list of ingredients from one measurement system to another.
 *
 * Uses fuzzy matching (via Fuse.js) against ingredient data stored in the database
 * to assist in identifying appropriate conversion logic. Can optionally skip
 * conversion of small units (e.g. "pinch", "dash") if specified.
 *
 * @param {Object[]} ingredients - An array of ingredient objects to convert.
 * @param {string} fromSystem - The measurement system to convert from (e.g., 'metric').
 * @param {string} toSystem - The measurement system to convert to (e.g., 'imperial').
 * @param {boolean} [skipSmallUnits=false] - Whether to skip conversion of small units like 'pinch' or 'dash'.
 * @returns {Promise<Object[]>} A promise that resolves to the array of converted ingredient objects.
 */
export async function convertIngredientsBackend(
	ingredients,
	fromSystem,
	toSystem,
	skipSmallUnits = false
) {
	const allIngredientData = await getAllIngredientData()

	// Initialize a Fuse instance with the retrieved ingredient data
	const fuseOptions = {
		keys: ['name'], // Specify the property to search on
		threshold: 0.8, // Adjust the threshold as needed
		includeScore: true,
		caseSensitive: false
	}
	const fuse = new Fuse(allIngredientData, fuseOptions)

	// If no system selected, return the raw ingredients
	return ingredients.map((ingredient) => {
		// Get the dietary preferences for the ingredient
		// const prefs = addFoodPreferences(ingredient.ingredient)
		// const dietLabel = getDietLabel(prefs)

		if (
			shouldSkipConversion(ingredient.unit, skipSmallUnits) ||
			!manipulateIngredient(ingredient, fromSystem, toSystem, fuse)
		) {
			// Return the original ingredient with the added dietary label
			return {
				...ingredient
				// dietLabel: dietLabel
			}
		}

		const converted = manipulateIngredient(ingredient, fromSystem, toSystem, fuse)
		if (converted === null || converted.error) {
			// Return the original ingredient with the added dietary label
			return {
				...ingredient
				// dietLabel: dietLabel
			}
		}

		// Return the converted ingredient with the added dietary label
		return {
			...converted
			// dietLabel: dietLabel
		}
	})
}
