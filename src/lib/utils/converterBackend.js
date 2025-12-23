import { manipulateIngredient, normalizeIngredient } from './converter'
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
	skipSmallUnits = false,
	lang = 'eng'
) {
	// Retrieve all ingredient data
	const allIngredientData = await getAllIngredientData()

	// Initialize a Fuse instance with the retrieved ingredient data
	const fuseOptions = {
		keys: ['name'], // Specify the property to search on
		threshold: 0.4, // Adjust the threshold as needed
		includeScore: true,
		caseSensitive: false
	}
	const fuse = new Fuse(allIngredientData, fuseOptions)

	// If no system selected, return the raw ingredients
	return ingredients.map((ingredient) => {
		// If the target system matches the source, just normalise so symbols/plurals are populated.
		if (toSystem === fromSystem) {
			return normalizeIngredient({ ...ingredient }, {}, lang)
		}

		// Skip conversions (but still normalise for display).
		if (shouldSkipConversion(ingredient.unit, skipSmallUnits)) {
			return normalizeIngredient({ ...ingredient }, {}, lang)
		}

		const converted = manipulateIngredient(ingredient, fromSystem, toSystem, fuse, lang)

		// If the conversion failed, return the normalised original ingredient
		if (!converted || converted.error) {
			return normalizeIngredient({ ...ingredient }, {}, lang)
		}

		// Normalise converted output to ensure symbols/unitPlural are set
		return normalizeIngredient({ ...converted }, {}, lang)
	})
}
