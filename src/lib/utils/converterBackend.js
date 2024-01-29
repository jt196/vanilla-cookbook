import { manipulateIngredient } from './converter'
import { shouldSkipConversion } from './units'
import { prisma } from '$lib/server/prisma'
import Fuse from 'fuse.js'

// Function to retrieve all ingredient data from your database
async function getAllIngredientData() {
	const ingredientData = await prisma.ingredient.findMany()
	return ingredientData
}

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
	if (!toSystem || fromSystem === toSystem) return ingredients
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
