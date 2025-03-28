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
 * This was used in the manipulate ingredients function before I transitioned to the database version
 *
 * @param {string} ingredient - The ingredient name to match.
 * @param {Array} lookupTable - The table of ingredients to search within.
 * @returns {Object|null} - Returns the matched ingredient object or null if no match is found.
 */
// eslint-disable-next-line no-unused-vars
export function fuzzyMatch(ingredient, lookupTable) {
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

/**
 * Searches through the food preferences database to find a match for the given ingredient name.
 * Returns an object with the following properties: vegan, vegetarian, pescatarian, canBeVegan.
 * If no match is found, returns an object with all properties set to true.
 *
 * @param {string} ingredientName - The ingredient name to search for.
 * @returns {Object} - An object with the search results.
 */
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

/**
 * Generates a string label indicating the dietary preference
 * of the given ingredient based on the given preferences.
 * @param {Object} prefs - The preferences object for the ingredient.
 * @returns {string} - A string label indicating the dietary preference.
 */
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
 * Normalizes an ingredient object by standardizing units, rounding quantity, and adding metadata.
 * @param {Object} ingredientObj - The original ingredient object.
 * @param {Object} options - Optional settings.
 * @param {boolean} options.skipRounding - If true, skip rounding quantity.
 * @returns {Object} - Normalized ingredient object.
 */
export function normalizeIngredient(ingredientObj, options = {}) {
	const { quantity, unit } = ingredientObj
	const unitData = units.find((u) => u.names.includes(unit))

	// If unit is unknown, return as-is with optional fallback handling
	if (!unitData) return { ...ingredientObj }

	const normalizedUnit = unitData.names[0]
	const plural = normalizedUnit + 's'
	const symbol = normalizedUnit.charAt(0)
	const decimalPlaces = unitData.decimalPlaces ?? 2

	const roundedQuantity =
		quantity && !options.skipRounding ? parseFloat(quantity.toFixed(decimalPlaces)) : quantity

	return {
		...ingredientObj,
		quantity: roundedQuantity,
		unit: normalizedUnit,
		unitPlural: plural,
		symbol: symbol,
		minQty: roundedQuantity,
		maxQty: roundedQuantity
	}
}

/**
 * Manipulates an ingredient object to convert its quantity and unit from one system to another.
 *
 * @param {Object} ingredientObj - The ingredient object to be manipulated.
 * @param {string} fromSystem - The original measurement system.
 * @param {string} toSystem - The target measurement system.
 * @returns {Object} - The manipulated ingredient object with converted quantity and unit.
 */
export const manipulateIngredient = (ingredientObj, fromSystem, toSystem, fuse) => {
	const { quantity, unit, ingredient } = ingredientObj
	// If no unit is provided, return the original ingredientObj
	if (!unit) {
		return normalizeIngredient(ingredientObj)
	}

	// Looking up the units to normalise them
	const fromUnits = units.find((unitLookup) => unitLookup.names.includes(unit)) || {}
	const fromUnit = fromUnits.names[0]

	// Convert the units simply to volumetric if metric volumetric
	if (toSystem === 'americanVolumetric' && (fromUnit === 'milliliter' || fromUnit === 'liter')) {
		// Convert to cups
		const { quantity: convertedQuantity, error } = converter(quantity, fromUnit, 'cups')
		if (error) {
			return { error }
		}
		// Use this quantity to determine the suitable unit
		const targetUnit = findSuitableUnit(toSystem, convertedQuantity * 236.588)
		// convert from cup to target unit
		const { quantity: convertedQuantityFinal } = converter(convertedQuantity, 'cup', targetUnit)

		// Return the object
		return {
			...ingredientObj,
			quantity: parseFloat(convertedQuantityFinal).toFixed(2),
			unit: targetUnit,
			unitPlural: targetUnit + 's',
			symbol: targetUnit?.charAt(0),
			minQty: parseFloat(convertedQuantityFinal).toFixed(2),
			maxQty: parseFloat(convertedQuantityFinal).toFixed(2)
		}
	}

	let quantityToUse = quantity

	// Convert the original unit to grams only if the system is not 'americanVolumetric'
	if (fromSystem !== 'americanVolumetric') {
		const { quantity: convertedQuantity, error } = converter(quantity, fromUnit, 'grams')
		if (error) {
			return { error }
		}
		quantityToUse = convertedQuantity
	}

	let dryIngredient = null
	let usedDefaultDensity = false

	if (toSystem === 'americanVolumetric' || fromSystem === 'americanVolumetric') {
		const result = fuse.search(ingredient)
		if (result.length > 0 && result[0].score < 0.3) {
			dryIngredient = result[0].item
		} else {
			// Use water density if no match found
			dryIngredient = { name: 'Water (default)', gramsPerCup: 236.588 } // 1g/ml → 236.588g per cup
			usedDefaultDensity = true
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
					maxQty: convertedQuantity,
					usedDefaultDensity
				}
			} else if (fromSystem === 'americanVolumetric' && toSystem === 'metric') {
				// Only run the conversion if the units match up with the AmVol units
				if (
					unit === 'cup' ||
					unit === 'teaspoon' ||
					unit === 'tablespoon' ||
					unit === 'quarts' ||
					unit === 'gallons' ||
					unit === 'floz'
				) {
					const { quantity: quantityInCups } = converter(quantityToUse, fromUnit, 'cup')
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
						maxQty: convertedQuantityMetric,
						usedDefaultDensity
					}
				}
			} else if (fromSystem === 'americanVolumetric' && toSystem === 'imperial') {
				if (unit === 'cup') {
					// Convert cups to grams
					const { quantity: quantityInCups } = converter(quantityToUse, fromUnit, 'cup')
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
						maxQty: convertedQuantityImperial,
						usedDefaultDensity
					}
				}
			}
		}
	}

	// Step 3: Convert to Intermediate Unit (grams)
	const intermediate = converter(quantity, fromUnit, 'gram')
	if (intermediate.error) return { error: intermediate.error }

	// Step 4: Convert to Target Unit
	const targetUnit = findSuitableUnit(toSystem, intermediate.quantity)
	const target = converter(intermediate.quantity, 'gram', targetUnit)
	if (target.error) return { error: target.error }

	// // Find the unit details from the units array
	// const targetUnitDetails = units.find((unit) => unit.names.includes(target.unit))

	// // Get the number of decimal places, or use a default value (e.g., 2)
	// const decimalPlaces = targetUnitDetails?.decimalPlaces ?? 2

	// // Round the quantity to the specified number of decimal places
	// const roundedQuantity = parseFloat(target.quantity.toFixed(decimalPlaces))

	// // Step 5: Update Object
	// return {
	// 	...ingredientObj,
	// 	quantity: roundedQuantity,
	// 	unit: target.unit ? target.unit : '',
	// 	unitPlural: target.unit ? target.unit + 's' : '',
	// 	symbol: target.unit?.charAt(0),
	// 	minQty: roundedQuantity,
	// 	maxQty: roundedQuantity
	// }
	const updatedIngredient = {
		...ingredientObj,
		quantity: target.quantity,
		unit: target.unit
	}

	return normalizeIngredient(updatedIngredient)
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
 * parseRecipeText(["Preheat oven to 350°F", "Bake at 180C"], "metric", "imperial");
 * // Returns: ["Preheat oven to 176°C", "Bake at 356°F"]
 *
 */
export function parseRecipeText(directions, toSystem, fromSystem) {
	return directions.map((direction) => parseTemperature(direction, toSystem, fromSystem))
}

export function convertIngredients(ingredients, fromSystem, toSystem) {
	const fuse = new Fuse(dryIngredientsConversion, fuseOptions)
	// If no system selected, return the raw ingredients
	if (!toSystem || fromSystem === toSystem) return ingredients
	return ingredients.map((ingredient) => {
		// Get the dietary preferences for the ingredient
		// const prefs = addFoodPreferences(ingredient.ingredient)
		// const dietLabel = getDietLabel(prefs)

		if (
			shouldSkipConversion(ingredient.unit) ||
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

/**
 * Converts temperatures in a given string from one system to another.
 *
 * The function identifies temperatures in Celsius, Fahrenheit, and generic "degrees" format.
 * It supports both single values and ranges (e.g., "70C", "70 to 80 degrees F").
 * Conversion is based on the specified source and target system.
 *
 * @param {string} direction - The input string containing temperature values.
 * @param {string} toSystem - The target system: 'metric', 'imperial', or 'americanVolumetric'.
 *                            Note: 'americanVolumetric' is treated as a subtype of 'imperial'.
 * @param {string} fromSystem - The source system: 'metric' or 'imperial'.
 *
 * @returns {string} - The string with converted temperatures, wrapped in `**`, or original if no conversion needed.
 *
 * @example
 * parseTemperature("Preheat oven to 350°F", "metric", "imperial");
 * // => "Preheat oven to **176°C**"
 *
 * parseTemperature("Set water to 70 to 80 degrees C", "imperial", "metric");
 * // => "Set water to **158-176°F**"
 */
export function parseTemperature(direction, toSystem, fromSystem) {
	// ─────────────────────────────────────────────
	// Regex to match Celsius temperatures
	// Matches single values ("70C") and ranges ("70-80C", "70 to 80C")
	// Capture groups:
	//   p1 = first number
	//   p2 = optional second number for range
	//   unit = °C, ºC, C, or degrees C
	const celsiusRegex =
		/(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?\s?(°C|ºC|C|degrees C)(?![a-zA-Z])/gi

	// Same structure as above for Fahrenheit values
	const fahrenheitRegex =
		/(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?\s?(°F|ºF|F|degrees F)(?![a-zA-Z])/gi

	// Matches Gas Mark (e.g., "Gas Mark 4"), not currently converted
	const gasMarkRegex = /Gas Mark (\d+)|gas (\d+)/gi

	// Matches generic "degrees" without °C/°F (e.g., "175 degrees", "175 degrees Fahrenheit")
	const genericDegreesRegex = /(\d+(?:\.\d+)?) degrees(?: (F(ahrenheit)?|C(elcius)?))?\b/gi

	// ─────────────────────────────────────────────
	// Determine if conversion is to/from imperial system
	const isTargetImperial = ['imperial', 'americanVolumetric'].includes(toSystem)
	const isSourceImperial = ['imperial', 'americanVolumetric'].includes(fromSystem)

	// Find all temperature matches in the string
	const celsiusMatches = direction.match(celsiusRegex) || []
	const fahrenheitMatches = direction.match(fahrenheitRegex) || []
	const genericDegreesMatches = direction.match(genericDegreesRegex) || []

	// ─────────────────────────────────────────────
	// Rule 1: Skip if both Celsius and Fahrenheit exist (likely already dual-labeled)
	if (celsiusMatches.length && fahrenheitMatches.length) {
		return direction
	}
	// Rule 2: Skip if Celsius only and target is metric (no change needed)
	if (celsiusMatches.length && toSystem === 'metric') {
		return direction
	}
	// Rule 3: Skip if Fahrenheit only and target is imperial (no change needed)
	if (fahrenheitMatches.length && toSystem === 'imperial') {
		return direction
	}

	// ─────────────────────────────────────────────
	// Converts a numeric value from one system to another
	function convertValue(value, from, to) {
		if (from === 'imperial' && to === 'metric') {
			return ((value - 32) * 5) / 9
		} else if (from === 'metric' && to === 'imperial') {
			return (value * 9) / 5 + 32
		}
		return value // Same system, return unchanged
	}

	// ─────────────────────────────────────────────
	// Handles matched temperatures (both ranges and single values)
	function convertMatch(match, p1, p2, unit, from, to, toUnit) {
		const val1 = parseFloat(p1)
		const val2 = p2 ? parseFloat(p2) : null

		if (val2 !== null) {
			// Convert both numbers in a range
			const converted1 = convertValue(val1, from, to).toFixed(0)
			const converted2 = convertValue(val2, from, to).toFixed(0)
			return `**${converted1}-${converted2}${toUnit}**`
		} else {
			// Single value conversion
			const converted = convertValue(val1, from, to).toFixed(0)
			return `**${converted}${toUnit}**`
		}
	}

	// ─────────────────────────────────────────────
	// Replace Celsius matches if converting to imperial
	if (celsiusMatches.length && isTargetImperial) {
		return direction.replace(celsiusRegex, (match, p1, p2, unit) =>
			convertMatch(match, p1, p2, unit, 'metric', 'imperial', '°F')
		)
	}

	// Replace Fahrenheit matches if converting to metric
	if (fahrenheitMatches.length && !isTargetImperial) {
		return direction.replace(fahrenheitRegex, (match, p1, p2, unit) =>
			convertMatch(match, p1, p2, unit, 'imperial', 'metric', '°C')
		)
	}

	// ─────────────────────────────────────────────
	// Replace generic "degrees" matches, e.g., "175 degrees"
	if (genericDegreesMatches.length > 0) {
		// Skip if systems are the same or both imperial
		if (fromSystem === toSystem || (isSourceImperial && isTargetImperial)) {
			return direction
		} else {
			// Convert each generic "degrees" match
			return direction.replace(genericDegreesRegex, (match, value, _, unit) => {
				const converted = convertValue(parseFloat(value), fromSystem, toSystem).toFixed(0)
				const targetUnit = isTargetImperial ? '°F' : '°C'
				return `**${converted}${targetUnit}**`
			})
		}
	}

	// ─────────────────────────────────────────────
	// No matches or conversions required
	return direction
}
