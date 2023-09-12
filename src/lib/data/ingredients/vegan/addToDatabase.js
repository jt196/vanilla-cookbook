export function addIngredientToDatabase(ingredientString, dietaryDatabase) {
	// Split the ingredient string by commas and trim whitespace
	const ingredients = ingredientString.split(',').map((ing) => ing.trim().toLowerCase())

	// Check if any of the ingredients are already in the database
	for (let item of dietaryDatabase) {
		for (let ing of ingredients) {
			if (item.ingredients.includes(ing)) {
				console.log(`Ingredient "${ing}" is already in the database.`)
				return // Exit if any ingredient is found
			}
		}
	}

	// If none of the ingredients are in the database, add them
	// default values, adjust as needed
	const newEntry = {
		ingredients: ingredients,
		vegan: false,
		vegetarian: false,
		pescatarian: true,
		canBeVegan: false
	}

	dietaryDatabase.push(newEntry)
	console.log(`Added new entry: ${ingredientString.toLowerCase()}`)
}

// Run this inside a file - making sure the imports are all good
// import { seafood } from '$lib/data/ingredients/vegan/seafood'
// import { foodPreferences } from '$lib/data/ingredients/vegan/vegan'
// import { addIngredientToDatabase } from '$lib/data/ingredients/vegan/addToDatabase'

// // Add each ingredient or group of ingredients to the database
// seafood.forEach((ingredient) => addIngredientToDatabase(ingredient, foodPreferences))

// // If you want to see the updated database
// console.log(foodPreferences)
