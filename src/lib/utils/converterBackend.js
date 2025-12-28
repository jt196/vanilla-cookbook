import { manipulateIngredient, normalizeIngredient } from './converter'
import { shouldSkipConversion } from './units'
import { getFuseOptions } from './config'
import { prisma } from '$lib/server/prisma'
import Fuse from 'fuse.js'

// Cache for Fuse instance to avoid recreating on every conversion
let cachedFuse = null
let cachedIngredientData = null

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
 * Gets or creates a cached Fuse instance for ingredient matching.
 *
 * This function caches the Fuse instance to avoid expensive re-instantiation
 * on every conversion. The cache persists across function calls within the
 * same server process. Uses configurable Fuse options from environment variables.
 *
 * @param {boolean} [forceRefresh=false] - If true, invalidates cache and creates new instance
 * @returns {Promise<Fuse>} A promise that resolves to a Fuse instance
 */
async function getCachedFuse(forceRefresh = false) {
	if (forceRefresh || !cachedFuse || !cachedIngredientData) {
		// Fetch fresh ingredient data
		cachedIngredientData = await getAllIngredientData()

		// Create new Fuse instance with configurable options
		const fuseOptions = getFuseOptions()
		cachedFuse = new Fuse(cachedIngredientData, fuseOptions)
	}

	return cachedFuse
}

/**
 * Clears the cached Fuse instance and ingredient data.
 * Call this after updating the ingredient database to ensure fresh data.
 *
 * @example
 * // After seeding new ingredients
 * await seedIngredients(prisma)
 * clearIngredientCache()
 */
export function clearIngredientCache() {
	cachedFuse = null
	cachedIngredientData = null
}

/**
 * Converts a list of ingredients from one measurement system to another.
 *
 * Uses fuzzy matching (via Fuse.js) against ingredient data stored in the database
 * to assist in identifying appropriate conversion logic. Can optionally skip
 * conversion of small units (e.g. "pinch", "dash") if specified.
 *
 * **Performance**: This function caches the Fuse instance across calls to avoid
 * expensive re-instantiation. The cache is shared across all calls within the same
 * server process.
 *
 * @param {Object[]} ingredients - An array of ingredient objects to convert.
 * @param {string} fromSystem - The measurement system to convert from (e.g., 'metric').
 * @param {string} toSystem - The measurement system to convert to (e.g., 'imperial').
 * @param {boolean} [skipSmallUnits=false] - Whether to skip conversion of small units like 'pinch' or 'dash'.
 * @param {string} [lang='eng'] - Language code for unit symbols and formatting.
 * @returns {Promise<Object[]>} A promise that resolves to the array of converted ingredient objects.
 *
 * @example
 * const ingredients = [
 *   { quantity: 2, unit: 'cup', ingredient: 'flour' },
 *   { quantity: 1, unit: 'teaspoon', ingredient: 'salt' }
 * ]
 * const converted = await convertIngredientsBackend(ingredients, 'americanVolumetric', 'metric')
 * // Result: [{ quantity: 240, unit: 'gram', ... }, { quantity: 4.8, unit: 'gram', ... }]
 */
export async function convertIngredientsBackend(
	ingredients,
	fromSystem,
	toSystem,
	skipSmallUnits = false,
	lang = 'eng'
) {
	try {
		// Get cached Fuse instance (creates new one if cache is empty)
		const fuse = await getCachedFuse()

		// Convert each ingredient using cached Fuse instance
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
	} catch (error) {
		console.error('Error converting ingredients:', error)
		// Fallback: return normalized original ingredients
		return ingredients.map((ingredient) => normalizeIngredient({ ...ingredient }, {}, lang))
	}
}
