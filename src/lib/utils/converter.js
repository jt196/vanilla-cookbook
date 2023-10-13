import { units, findSuitableUnit, shouldSkipConversion } from '$lib/utils/units'
import Fuse from 'fuse.js'
import { dryIngredientsConversion } from '$lib/utils/dryIngredientsConversion'
import { foodPreferences } from '$lib/data/ingredients/vegan/vegan'

/**
 * Converts a quantity from one unit to another.
 *
 * @param {number} quantity - The quantity of the 'from' unit.
 * @param {string} from - The original unit to be converted.
 * @param {string} [to='grams'] - The unit to be converted to.
 * @returns {{quantity: number, unit: string} | {error: string}} - Returns an object containing either the converted quantity and unit or an error message.
 */
export const converter = (quantity, from, to = 'grams') => {
	if (quantity <= 0) return { error: 'Quantity must be greater than 0' }

	// Check if 'from' or 'to' is null or undefined
	if (!from) return { quantity, unit: to } // return original quantity and target unit
	if (!to) return { error: 'Target unit is missing' }

	const fromVal = from.length > 1 ? from.toLowerCase() : from
	const toVal = to.length > 1 ? to.toLowerCase() : to

	const fromUnit = units.find((unit) => unit.names.includes(fromVal)) || {}
	const toUnit = units.find((unit) => unit.names.includes(toVal)) || {}

	const fromUnitGrams = fromUnit.grams
	const toUnitGrams = toUnit.grams

	if (!fromUnitGrams) return { error: `Unit unknown: ${fromVal}` }
	if (!toUnitGrams) return { error: `Unit unknown: ${toVal}` }

	const ratio = fromUnitGrams / toUnitGrams
	const total = ratio * quantity

	return { quantity: total, unit: to }
}

/**
 * Determines the dominant measurement system used in an array of ingredients.
 *
 * @param {Array} ingredientArray - An array of ingredient objects.
 * @returns {{system: string, counts: Object}} - The dominant system and the counts of each system.
 */
export const determineSystem = (ingredientArray) => {
	const systemCounts = {
		metric: 0,
		imperial: 0,
		americanVolumetric: 0
	}

	ingredientArray.forEach((ingredient) => {
		const { unit } = ingredient

		Object.keys(measurementSystems).forEach((system) => {
			if (measurementSystems[system].includes(unit)) {
				systemCounts[system]++
			}
		})
	})

	// Check for the specific condition
	if (systemCounts.imperial > 0 && systemCounts.americanVolumetric > 0) {
		return { system: 'americanVolumetric', counts: systemCounts }
	}

	// Determine the dominant system
	let dominantSystem = null
	let maxCount = 0
	let inconclusive = false

	Object.keys(systemCounts).forEach((system) => {
		if (systemCounts[system] > maxCount) {
			maxCount = systemCounts[system]
			dominantSystem = system
			inconclusive = false
		} else if (systemCounts[system] === maxCount) {
			inconclusive = true
		}
	})

	if (inconclusive) {
		return { system: 'inconclusive', counts: systemCounts }
	}
	return { system: dominantSystem, counts: systemCounts }
}

/**
 * Mapping of measurement systems to their respective units.
 * @type {Object}
 */
const systemToUnitsMap = {
	metric: ['gram', 'kilogram', 'liter', 'milliliter'],
	imperial: ['fluid ounce', 'pound', 'gallon', 'ounce'],
	americanVolumetric: ['cup', 'quart']
}

/**
 * Manipulates an ingredient object to convert its quantity and unit from one system to another.
 *
 * @param {Object} ingredientObj - The ingredient object to be manipulated.
 * @param {string} fromSystem - The original measurement system.
 * @param {string} toSystem - The target measurement system.
 * @returns {Object} - The manipulated ingredient object with converted quantity and unit.
 */
const measurementSystems = Object.keys(systemToUnitsMap).reduce((acc, system) => {
	acc[system] = []
	systemToUnitsMap[system].forEach((unit) => {
		const unitObj = units.find((u) => u.names.includes(unit))
		if (unitObj) {
			acc[system] = [...acc[system], ...unitObj.names]
		}
	})
	return acc
}, {})

const fuseOptions = {
	keys: ['names'], // Changed from 'name' to 'names'
	includeScore: true,
	caseSensitive: false,
	threshold: 0.3 // Lower the threshold, the stricter the match. Range [0, 1]
}

/**
 * Attempts to find a match for an ingredient in a lookup table.
 *
 * @param {string} ingredient - The ingredient name to match.
 * @param {Array} lookupTable - The table of ingredients to search within.
 * @returns {Object|null} - Returns the matched ingredient object or null if no match is found.
 */
function fuzzyMatch(ingredient, lookupTable) {
	const words = ingredient.toLowerCase().split(/\W+/) // Split by non-word characters
	for (const word of words) {
		for (const item of lookupTable) {
			for (const name of item.names) {
				// Loop through the names array
				if (name.toLowerCase().includes(word)) {
					return item
				}
			}
		}
	}
	return null
}

const fuseVeganOptions = {
	keys: ['ingredients'],
	threshold: 0.5, // Adjusted
	caseSensitive: false,
	includeScore: true,
	ignoreLocation: true,
	minMatchCharLength: 4, // Adjusted
	tokenize: true, // Added
	matchAllTokens: true // Added
}

const veganFuse = new Fuse(foodPreferences, fuseVeganOptions)

export function addFoodPreferences(ingredientName) {
	// Primary search with fuzzy check
	const results = veganFuse.search(ingredientName)

	if (results.length > 0 && results[0].score < 0.4) {
		const matchedItem = results[0].item
		return {
			vegan: matchedItem.vegan,
			vegetarian: matchedItem.vegetarian,
			pescatarian: matchedItem.pescatarian,
			canBeVegan: matchedItem.canBeVegan
		}
	}

	// Second Pass: Simple substring check using JS .includes
	// check if any term from the ingredients array of each item is a substring of the ingredientName
	for (let item of veganFuse._docs) {
		for (let term of item.ingredients) {
			if (ingredientName.includes(term)) {
				return {
					vegan: item.vegan,
					vegetarian: item.vegetarian,
					pescatarian: item.pescatarian,
					canBeVegan: item.canBeVegan
				}
			}
		}
	}

	return {
		vegan: true,
		vegetarian: true,
		pescatarian: true,
		canBeVegan: true
	} // default values if ingredient is not found or doesn't match closely enough
}

export function getDietLabel(prefs) {
	if (prefs.vegan) {
		return ''
	} else if (prefs.canBeVegan) {
		return 'VEGAN?'
	} else if (prefs.pescatarian && !prefs.vegetarian) {
		return 'PESCA'
	} else if (prefs.vegetarian && !prefs.vegan) {
		return 'NON-VEGAN'
	}
	return 'MEAT' // default return value if none of the conditions are met
}

/**
 * Fuse instance for fuzzy searching within dry ingredients.
 * @type {Fuse}
 */
const fuse = new Fuse(dryIngredientsConversion, fuseOptions)

/**
 * Manipulates an ingredient object to convert its quantity and unit from one system to another.
 *
 * @param {Object} ingredientObj - The ingredient object to be manipulated.
 * @param {string} fromSystem - The original measurement system.
 * @param {string} toSystem - The target measurement system.
 * @returns {Object} - The manipulated ingredient object with converted quantity and unit.
 */
export const manipulateIngredient = (ingredientObj, fromSystem, toSystem) => {
	const { quantity, unit, ingredient } = ingredientObj
	// If no unit is provided, return the original ingredientObj
	if (!unit) {
		return ingredientObj
	}

	let quantityToUse = quantity

	// Convert the original unit to grams only if the system is not 'americanVolumetric'
	if (fromSystem !== 'americanVolumetric') {
		const { quantity: convertedQuantity, error } = converter(quantity, unit, 'grams')
		if (error) {
			return { error }
		}
		quantityToUse = convertedQuantity
	}

	let dryIngredient = null

	if (toSystem === 'americanVolumetric' || fromSystem === 'americanVolumetric') {
		const result = fuse.search(ingredient)
		if (result.length > 0 && result[0].score < 0.3) {
			dryIngredient = result[0].item
		} else {
			dryIngredient = fuzzyMatch(ingredient, dryIngredientsConversion)
		}

		if (dryIngredient) {
			if (toSystem === 'americanVolumetric') {
				let convertedQuantity = quantityToUse / dryIngredient.gramsPerCup
				const targetUnit = findSuitableUnit(toSystem, convertedQuantity * 236.588) // Convert cups to grams

				// Adjust the convertedQuantity based on the targetUnit
				let decimalPlaces = 2 // Default for cups
				if (targetUnit === 'tablespoon') {
					convertedQuantity *= 16 // 1 cup = 16 tablespoons
					decimalPlaces = 1
				} else if (targetUnit === 'teaspoon') {
					convertedQuantity *= 48 // 1 cup = 48 teaspoons
					decimalPlaces = 1
				}

				convertedQuantity = parseFloat(convertedQuantity.toFixed(decimalPlaces))

				return {
					...ingredientObj,
					dryIngredient,
					quantity: convertedQuantity,
					unit: targetUnit,
					unitPlural: targetUnit + 's',
					symbol: targetUnit?.charAt(0),
					minQty: convertedQuantity,
					maxQty: convertedQuantity
				}
			} else if (fromSystem === 'americanVolumetric' && toSystem === 'metric') {
				// Only run the conversion if the units match up with the AmVol units
				if (
					unit === 'cup' ||
					unit === 'teaspoon' ||
					unit === 'tablespoon' ||
					unit === 'quarts' ||
					unit === 'gallons'
				) {
					const { quantity: quantityInCups } = converter(quantityToUse, unit, 'cup')
					let convertedQuantityGrams = quantityInCups * dryIngredient.gramsPerCup
					// Find the target unit according to the amount
					const targetMetricUnit = findSuitableUnit(toSystem, convertedQuantityGrams)
					// Convert the grams into the suitable unit - don't convert if already grams
					let convertedQuantityMetric
					// Don't run the conversion if already grams
					if (targetMetricUnit === 'gram') {
						convertedQuantityMetric = convertedQuantityGrams
					} else {
						// Otherwise, convert grams to kg etc
						;({ quantity: convertedQuantityMetric } = converter(
							convertedQuantityGrams,
							'gram',
							targetMetricUnit
						))
					}
					convertedQuantityMetric = parseFloat(convertedQuantityMetric.toFixed(1))
					return {
						...ingredientObj,
						dryIngredient,
						quantity: convertedQuantityMetric,
						unit: targetMetricUnit,
						unitPlural: targetMetricUnit + 's',
						symbol: targetMetricUnit?.charAt(0),
						minQty: convertedQuantityMetric,
						maxQty: convertedQuantityMetric
					}
				}
			} else if (fromSystem === 'americanVolumetric' && toSystem === 'imperial') {
				if (unit === 'cup') {
					// Convert cups to grams
					const { quantity: quantityInCups } = converter(quantityToUse, unit, 'cup')
					let convertedQuantityGrams = parseFloat(
						(quantityInCups * dryIngredient.gramsPerCup).toFixed(1)
					)
					// Find a suitable unit - if it's bigger than 28 ounces, use lb etc
					const targetImperialUnit = findSuitableUnit(toSystem, convertedQuantityGrams)
					let convertedQuantityImperial
						// Convert this unit to target imperial
					;({ quantity: convertedQuantityImperial } = converter(
						convertedQuantityGrams,
						'gram',
						targetImperialUnit
					))
					// Convert to a float
					convertedQuantityImperial = parseFloat(convertedQuantityImperial.toFixed(1))
					return {
						...ingredientObj,
						dryIngredient,
						quantity: convertedQuantityImperial,
						unit: targetImperialUnit,
						unitPlural: targetImperialUnit + 's',
						symbol: targetImperialUnit?.charAt(0),
						minQty: convertedQuantityImperial,
						maxQty: convertedQuantityImperial
					}
				}
			}
		}
	}

	// Step 3: Convert to Intermediate Unit (grams)
	const intermediate = converter(quantity, unit, 'gram')
	if (intermediate.error) return { error: intermediate.error }

	// Step 4: Convert to Target Unit
	const targetUnit = findSuitableUnit(toSystem, intermediate.quantity)
	const target = converter(intermediate.quantity, 'gram', targetUnit)
	if (target.error) return { error: target.error }

	// Find the unit details from the units array
	const targetUnitDetails = units.find((unit) => unit.names.includes(target.unit))

	// Get the number of decimal places, or use a default value (e.g., 2)
	const decimalPlaces = targetUnitDetails?.decimalPlaces ?? 2

	// Round the quantity to the specified number of decimal places
	const roundedQuantity = parseFloat(target.quantity.toFixed(decimalPlaces))

	// Step 5: Update Object
	return {
		...ingredientObj,
		quantity: roundedQuantity,
		unit: target.unit ? target.unit : '',
		unitPlural: target.unit ? target.unit + 's' : '',
		symbol: target.unit?.charAt(0),
		minQty: roundedQuantity,
		maxQty: roundedQuantity
	}
}

/**
 * Converts temperatures in an array of direction strings from one system to another.
 *
 * This function iterates over each direction in the array and converts any temperatures
 * found within each direction from the original system to the target system using the
 * `parseTemperature` function.
 *
 * @param {string[]} directions - An array of direction strings containing temperature values to be converted.
 * @param {string} toSystem - The target temperature system for conversion.
 *                            Accepted values: 'metric', 'imperial', 'americanVolumetric'.
 * @param {string} fromSystem - The original temperature system of the values in the direction strings.
 *                              Accepted values: 'metric', 'imperial'.
 *
 * @returns {string[]} - An array of direction strings with temperatures converted to the target system.
 *
 * @example
 * parseDirections(["Preheat oven to 350°F", "Bake at 180C"], "metric", "imperial");
 * // Returns: ["Preheat oven to 176°C", "Bake at 356°F"]
 *
 */
export function parseDirections(directions, toSystem, fromSystem) {
	return directions.map((direction) => parseTemperature(direction, toSystem, fromSystem))
}

/**
 * Converts temperatures in a given string from one system to another.
 *
 * The function identifies temperatures in Celsius, Fahrenheit, and generic "degrees" format.
 * It then converts them based on the specified target system.
 *
 * @param {string} direction - The input string containing temperature values to be converted.
 * @param {string} toSystem - The target temperature system.
 *                            Accepted values: 'metric', 'imperial', 'americanVolumetric'.
 *                            Note: 'americanVolumetric' is treated as a subtype of 'imperial'.
 * @param {string} fromSystem - The original temperature system of the values in the input string.
 *                              Accepted values: 'metric', 'imperial'.
 *
 * @returns {string} - The input string with temperatures converted to the target system.
 *
 * @example
 * parseTemperature("Preheat oven to 350°F", "metric", "imperial");
 * // Returns: "Preheat oven to 176°C"
 *
 * @example
 * parseTemperature("Heat to 180C", "imperial", "metric");
 * // Returns: "Heat to 356°F"
 */
export function parseTemperature(direction, toSystem, fromSystem) {
	console.log('Parsing temperature!')
	const celsiusRegex = /(\d+-\d+|\d+(\.\d+)?)\s?(°C|ºC|C|degrees C)(?![a-zA-Z])/gi
	const fahrenheitRegex = /(\d+-\d+|\d+(\.\d+)?)\s?(°F|ºF|F|degrees F)(?![a-zA-Z])/gi
	const gasMarkRegex = /Gas Mark (\d+)|gas (\d+)/gi
	const genericDegreesRegex = /(\d+(\.\d+)?) degrees(?: (F(ahrenheit)?|C(elcius)?))?\b/gi

	// Find all matches for each temperature type in the given direction
	const celsiusMatches = direction.match(celsiusRegex) || []
	const fahrenheitMatches = direction.match(fahrenheitRegex) || []
	// Matches any "Gas Mark 4 or gas 4" references in the text, at the moment, not processing these.
	// eslint-disable-next-line no-unused-vars
	const gasMarkMatches = direction.match(gasMarkRegex) || []
	const genericDegreesMatches = direction.match(genericDegreesRegex) || []
	// Logging the matches for debugging purposes
	const isTargetImperial = ['imperial', 'americanVolumetric'].includes(toSystem)
	const isSourceImperial = ['imperial', 'americanVolumetric'].includes(fromSystem)

	if (celsiusMatches.length && fahrenheitMatches.length) {
		return direction // Rule 1
	}

	if (celsiusMatches.length && toSystem === 'metric') {
		return direction // Rule 2
	}

	if (fahrenheitMatches.length && toSystem === 'imperial') {
		return direction // Rule 3
	}

	function convertValue(value, from, to) {
		if (from === 'imperial' && to === 'metric') {
			return ((value - 32) * 5) / 9
		} else if (from === 'metric' && to === 'imperial') {
			return (value * 9) / 5 + 32
		}
		return value
	}

	function convertMatch(match, from, to, toUnit) {
		// Split the match by '-' to handle ranges.
		// If it's a single value, it'll result in an array with one element.
		const values = match.split('-').map(parseFloat)

		// Convert each value in the array using the convertValue function.
		// The result is an array of converted values.
		const convertedValues = values.map((value) => convertValue(value, from, to).toFixed(0))

		// Join the converted values with '-' (if it's a range) and append the target unit.
		return '**' + convertedValues.join('-') + toUnit + '**'
	}

	// Handling generic "degrees" format
	if (genericDegreesMatches.length > 0) {
		// Skip this if from/toSystem are the same, or both imperial
		if (fromSystem === toSystem || (isSourceImperial && isTargetImperial)) {
			return direction
		} else {
			if ((fromSystem === 'imperial' || 'americanVolumetric') && !isTargetImperial) {
				return direction.replace(genericDegreesRegex, (match) =>
					convertMatch(match, 'imperial', 'metric', '°C')
				)
			} else if (fromSystem === 'metric' && isTargetImperial) {
				return direction.replace(genericDegreesRegex, (match) =>
					convertMatch(match, fromSystem, toSystem, '°F')
				)
			}
		}
	}

	// Handling Celsius and Fahrenheit conversions
	if (celsiusMatches.length && isTargetImperial) {
		return direction.replace(celsiusRegex, (match) =>
			convertMatch(match, 'metric', 'imperial', '°F')
		)
	}

	if (fahrenheitMatches.length && !isTargetImperial) {
		return direction.replace(fahrenheitRegex, (match) =>
			convertMatch(match, 'imperial', 'metric', '°C')
		)
	}
	return direction
}

export function convertIngredients(ingredients, fromSystem, toSystem) {
	// If no system selected, return the raw ingredients
	if (!toSystem || fromSystem === toSystem) return ingredients
	return ingredients.map((ingredient) => {
		// Get the dietary preferences for the ingredient
		// const prefs = addFoodPreferences(ingredient.ingredient)
		// const dietLabel = getDietLabel(prefs)

		if (
			shouldSkipConversion(ingredient.unit) ||
			!manipulateIngredient(ingredient, fromSystem, toSystem)
		) {
			// Return the original ingredient with the added dietary label
			return {
				...ingredient
				// dietLabel: dietLabel
			}
		}

		const converted = manipulateIngredient(ingredient, fromSystem, toSystem)
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
