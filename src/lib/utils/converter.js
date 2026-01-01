import { findSuitableUnit } from '$lib/utils/units'
import { fuseConfig } from '$lib/utils/config'
import Fuse from 'fuse.js'
import { foodPreferences } from '$lib/data/ingredients/vegan/vegan'
import { getSymbol } from '$lib/submodules/recipe-ingredient-parser/src/index.js'
import { i18nMap } from '$lib/submodules/recipe-ingredient-parser/src/i18n'

// Get units data for a given language (defaults to English)
function getUnitsDataForLang(lang = 'eng') {
	return i18nMap[lang]?.unitsData ?? i18nMap.eng.unitsData
}

/**
 * Finds unit data by searching through unit names.
 * @param {string} unitName - The unit name to search for
 * @param {string} [lang='eng'] - Language key for units data
 * @returns {Object|null} Unit data with canonical name, or null if not found
 */
function findUnitData(unitName, lang = 'eng') {
	if (!unitName) return null

	const unitsData = getUnitsDataForLang(lang)
	const lowerName = unitName.toLowerCase()

	// Try direct lookup first
	if (unitsData[lowerName]) {
		return { canonical: lowerName, ...unitsData[lowerName] }
	}

	// Search through all unit names
	for (const [canonical, data] of Object.entries(unitsData)) {
		if (data.names.map((n) => n.toLowerCase()).includes(lowerName)) {
			return { canonical, ...data }
		}
	}

	return null
}

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

	const fromUnitData = findUnitData(fromVal)
	const toUnitData = findUnitData(toVal)

	if (!fromUnitData) return { error: `Unit unknown: ${fromVal}` }
	if (!toUnitData) return { error: `Unit unknown: ${toVal}` }

	// Get conversion factors - support both weight (grams) and volume (milliliters)
	const fromUnitGrams =
		fromUnitData.conversionFactor?.grams ?? fromUnitData.conversionFactor?.milliliters ?? 0
	const toUnitGrams =
		toUnitData.conversionFactor?.grams ?? toUnitData.conversionFactor?.milliliters ?? 0

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
export const determineSystem = (ingredientArray = []) => {
	const systemCounts = {
		metric: 0,
		imperial: 0,
		americanVolumetric: 0
	}

	ingredientArray.forEach((ingredient) => {
		const system = ingredient.unitSystem
		if (system && systemCounts.hasOwnProperty(system)) {
			systemCounts[system]++
		}
	})

	// Early return if mixed imperial + americanVolumetric => prefer americanVolumetric
	if (systemCounts.imperial > 0 && systemCounts.americanVolumetric > 0) {
		return { system: 'americanVolumetric', counts: systemCounts }
	}

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
	// If nothing was detected, default to metric as a safe baseline.
	if (!dominantSystem) {
		return { system: 'metric', counts: systemCounts }
	}
	return { system: dominantSystem, counts: systemCounts }
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
 * Finds ingredient density using Fuse fuzzy matching with multi-word fallback.
 *
 * This function attempts to match ingredients in four passes:
 * 1. Ingredient + instructions (e.g., "sliced onions") with strict threshold - if instructions provided
 * 2. Full ingredient name with strict threshold
 * 3. Individual words (for multi-word ingredients like "yellow onions") with relaxed threshold
 * 4. Water density as final fallback
 *
 * @param {string} ingredient - The ingredient name to search for
 * @param {Fuse} fuse - Fuse instance configured with ingredient database
 * @param {Array<string>} [instructions=[]] - Optional preparation instructions (sliced, chopped, etc.)
 * @returns {{ingredient: Object, usedDefaultDensity: boolean, matchType: string, matchedWord?: string, matchScore: number}} Matched ingredient and metadata
 */
function findIngredientDensity(ingredient, fuse, instructions = []) {
	// Pass 1: Try with instructions included (if provided)
	if (instructions && instructions.length > 0) {
		const withInstructions = `${instructions.join(' ')} ${ingredient}`.trim()
		const instructionResult = fuse.search(withInstructions)
		if (instructionResult.length > 0 && instructionResult[0].score < fuseConfig.strictThreshold) {
			return {
				ingredient: instructionResult[0].item,
				usedDefaultDensity: false,
				matchType: 'instruction',
				matchScore: instructionResult[0].score
			}
		}
	}

	// Pass 2: Try full ingredient name with strict threshold
	const result = fuse.search(ingredient)
	if (result.length > 0 && result[0].score < fuseConfig.strictThreshold) {
		return {
			ingredient: result[0].item,
			usedDefaultDensity: false,
			matchType: 'exact',
			matchScore: result[0].score
		}
	}

	// Pass 3: Try relaxed full-name match (captures word order differences)
	const relaxedResult = fuse.search(ingredient)
	const relaxedMatch =
		relaxedResult.length > 0 && relaxedResult[0].score < fuseConfig.relaxedThreshold
			? {
					ingredient: relaxedResult[0].item,
					usedDefaultDensity: false,
					matchType: 'fuzzy',
					matchScore: relaxedResult[0].score
				}
			: null

	// Pass 4: Try individual words for multi-word ingredients (skip short words)
	let bestWordMatch = null
	const words = ingredient
		.toLowerCase()
		.split(/\s+/)
		.filter((word) => word.length >= fuseConfig.minWordLength)

	// If relaxed match covers all significant words, prefer it immediately
	if (
		relaxedMatch &&
		words.length > 1 &&
		words.every((word) => relaxedMatch.ingredient.name.toLowerCase().includes(word))
	) {
		return relaxedMatch
	}

	// Pass 4b If no relaxed match, try manual unordered match against dataset (handles comma-separated names)
	if (!relaxedMatch && words.length > 1 && Array.isArray(fuse._docs)) {
		const unorderedMatch = fuse._docs.find(
			(doc) =>
				typeof doc?.name === 'string' &&
				words.every((word) => doc.name.toLowerCase().includes(word))
		)
		if (unorderedMatch) {
			return {
				ingredient: unorderedMatch,
				usedDefaultDensity: false,
				matchType: 'fuzzy',
				matchScore: fuseConfig.relaxedThreshold // approximate
			}
		}
	}

	if (words.length > 1) {
		for (const word of words) {
			const wordResult = fuse.search(word)
			if (wordResult.length > 0 && wordResult[0].score < fuseConfig.relaxedThreshold) {
				const candidate = {
					ingredient: wordResult[0].item,
					usedDefaultDensity: false,
					matchType: 'word',
					matchedWord: word,
					matchScore: wordResult[0].score
				}
				if (!bestWordMatch || candidate.matchScore < bestWordMatch.matchScore) {
					bestWordMatch = candidate
				}
			}
		}
	}

	// Choose the better of relaxed full-name vs best word match (prefer better score)
	if (relaxedMatch && (!bestWordMatch || relaxedMatch.matchScore < bestWordMatch.matchScore)) {
		return relaxedMatch
	}
	if (bestWordMatch) {
		return bestWordMatch
	}

	// Pass 5: Fallback - Use water density if no match found
	return {
		ingredient: { name: 'Water (default)', gramsPerCup: 236.588 }, // 1g/ml → 236.588g per cup
		usedDefaultDensity: true,
		matchType: 'fallback',
		matchScore: 1
	}
}

/**
 * Converts metric volumetric units (milliliters/liters) to americanVolumetric (cups/tbsp/tsp).
 *
 * This is a direct volume-to-volume conversion that doesn't require ingredient density.
 *
 * @param {Object} ingredientObj - The ingredient object to convert
 * @param {string} fromUnit - Source unit (milliliter or liter)
 * @param {number} quantity - Amount to convert
 * @param {string} lang - Language code for symbols
 * @returns {Object} Converted ingredient object
 */
function convertMetricVolumetricToAmerican(ingredientObj, fromUnit, quantity, lang) {
	// Convert to cups
	const { quantity: convertedQuantity, error } = converter(quantity, fromUnit, 'cups')
	if (error) {
		return { error }
	}

	// Use this quantity to determine the suitable unit
	const targetUnit = findSuitableUnit('americanVolumetric', convertedQuantity * 236.588)

	// Convert from cup to target unit
	const { quantity: convertedQuantityFinal } = converter(convertedQuantity, 'cup', targetUnit)

	// Return the object
	return {
		...ingredientObj,
		quantity: parseFloat(convertedQuantityFinal).toFixed(2),
		unit: targetUnit,
		unitPlural: targetUnit + 's',
		symbol: getSymbol(targetUnit, lang),
		minQty: parseFloat(convertedQuantityFinal).toFixed(2),
		maxQty: parseFloat(convertedQuantityFinal).toFixed(2)
	}
}

/**
 * Converts weight (grams) to americanVolumetric units using ingredient-specific density.
 *
 * @param {Object} ingredientObj - The ingredient object to convert
 * @param {number} quantityInGrams - Weight in grams
 * @param {Object} dryIngredient - Ingredient density data (with gramsPerCup)
 * @param {boolean} usedDefaultDensity - Whether water density was used as fallback
 * @param {string} lang - Language code for symbols
 * @returns {Object} Converted ingredient object
 */
function convertToAmericanVolumetric(
	ingredientObj,
	quantityInGrams,
	dryIngredient,
	usedDefaultDensity,
	lang
) {
	let convertedQuantity = quantityInGrams / dryIngredient.gramsPerCup
	const targetUnit = findSuitableUnit('americanVolumetric', convertedQuantity * 236.588)

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
		symbol: getSymbol(targetUnit, lang),
		minQty: convertedQuantity,
		maxQty: convertedQuantity,
		usedDefaultDensity
	}
}

/**
 * Converts americanVolumetric units to metric (grams/kg) using ingredient-specific density.
 *
 * @param {Object} ingredientObj - The ingredient object to convert
 * @param {number} quantityInOriginalUnit - Amount in original unit (cup, tsp, tbsp, etc.)
 * @param {string} fromUnit - Source unit name
 * @param {Object} dryIngredient - Ingredient density data (with gramsPerCup)
 * @param {boolean} usedDefaultDensity - Whether water density was used as fallback
 * @param {string} lang - Language code for symbols
 * @returns {Object|null} Converted ingredient object, or null if unit not supported
 */
function convertAmericanVolumetricToMetric(
	ingredientObj,
	quantityInOriginalUnit,
	fromUnit,
	dryIngredient,
	usedDefaultDensity,
	lang
) {
	// Only run the conversion if the units match up with the AmVol units
	if (
		fromUnit !== 'cup' &&
		fromUnit !== 'teaspoon' &&
		fromUnit !== 'tablespoon' &&
		fromUnit !== 'quarts' &&
		fromUnit !== 'gallons' &&
		fromUnit !== 'floz'
	) {
		return null // Not a valid americanVolumetric unit
	}

	const { quantity: quantityInCups } = converter(quantityInOriginalUnit, fromUnit, 'cup')
	let convertedQuantityGrams = quantityInCups * dryIngredient.gramsPerCup

	// Find the target unit according to the amount
	const targetMetricUnit = findSuitableUnit('metric', convertedQuantityGrams)

	// Convert the grams into the suitable unit - don't convert if already grams
	let convertedQuantityMetric
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
		symbol: getSymbol(targetMetricUnit, lang),
		minQty: convertedQuantityMetric,
		maxQty: convertedQuantityMetric,
		usedDefaultDensity
	}
}

/**
 * Converts americanVolumetric cups to imperial (ounces/pounds) using ingredient-specific density.
 *
 * @param {Object} ingredientObj - The ingredient object to convert
 * @param {number} quantityInOriginalUnit - Amount in original unit
 * @param {string} fromUnit - Source unit name (must be 'cup')
 * @param {Object} dryIngredient - Ingredient density data (with gramsPerCup)
 * @param {boolean} usedDefaultDensity - Whether water density was used as fallback
 * @param {string} lang - Language code for symbols
 * @returns {Object|null} Converted ingredient object, or null if unit not 'cup'
 */
function convertAmericanVolumetricToImperial(
	ingredientObj,
	quantityInOriginalUnit,
	fromUnit,
	dryIngredient,
	usedDefaultDensity,
	lang
) {
	if (fromUnit !== 'cup') {
		return null // Only handles cups for now
	}

	// Convert cups to grams
	const { quantity: quantityInCups } = converter(quantityInOriginalUnit, fromUnit, 'cup')
	let convertedQuantityGrams = parseFloat((quantityInCups * dryIngredient.gramsPerCup).toFixed(1))

	// Find a suitable unit - if it's bigger than 28 ounces, use lb etc
	const targetImperialUnit = findSuitableUnit('imperial', convertedQuantityGrams)

	// Convert this unit to target imperial
	let convertedQuantityImperial
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
		symbol: getSymbol(targetImperialUnit, lang),
		minQty: convertedQuantityImperial,
		maxQty: convertedQuantityImperial,
		usedDefaultDensity
	}
}

/**
 * Converts standard weight units (grams/kg ↔ ounces/pounds) without ingredient density.
 *
 * This is the fallback conversion pathway for weight-to-weight conversions.
 *
 * @param {Object} ingredientObj - The ingredient object to convert
 * @param {number} quantity - Amount to convert
 * @param {string} fromUnit - Source unit name
 * @param {string} toSystem - Target measurement system
 * @param {string} lang - Language code for symbols
 * @returns {Object} Converted ingredient object
 */
function convertStandardWeightUnits(ingredientObj, quantity, fromUnit, toSystem, lang) {
	// Step 1: Convert to intermediate unit (grams)
	const intermediate = converter(quantity, fromUnit, 'gram')
	if (intermediate.error) return { error: intermediate.error }

	// Step 2: Convert to target unit
	const targetUnit = findSuitableUnit(toSystem, intermediate.quantity)
	const target = converter(intermediate.quantity, 'gram', targetUnit)
	if (target.error) return { error: target.error }

	// Step 3: Normalize and return
	const updatedIngredient = {
		...ingredientObj,
		quantity: target.quantity,
		unit: target.unit
	}

	return normalizeIngredient(updatedIngredient, {}, lang)
}

/**
 * Normalizes an ingredient object by standardizing units, rounding quantity, and adding metadata.
 * @param {Object} ingredientObj - The original ingredient object.
 * @param {Object} options - Optional settings.
 * @param {boolean} options.skipRounding - If true, skip rounding quantity.
 * @returns {Object} - Normalized ingredient object.
 */
export function normalizeIngredient(ingredientObj, options = {}, lang = 'eng') {
	const { quantity, unit } = ingredientObj
	const qtyNum =
		typeof quantity === 'string' ? Number(quantity) : typeof quantity === 'number' ? quantity : null
	const unitData = findUnitData(unit, lang)

	// If unit is unknown, return as-is with optional fallback handling
	if (!unitData) return { ...ingredientObj }

	const normalizedUnit = unitData.canonical
	const plural = unitData.plural
	const symbol = getSymbol(normalizedUnit, lang)
	const decimalPlaces = unitData.decimalPlaces ?? 2

	const roundedQuantity =
		typeof qtyNum === 'number' && !Number.isNaN(qtyNum) && !options.skipRounding
			? parseFloat(qtyNum.toFixed(decimalPlaces))
			: qtyNum

	return {
		...ingredientObj,
		quantity: roundedQuantity,
		unit: normalizedUnit,
		unitPlural: plural,
		symbol: symbol,
		minQty: roundedQuantity ?? ingredientObj.minQty,
		maxQty: roundedQuantity ?? ingredientObj.maxQty
	}
}

/**
 * Manipulates an ingredient object to convert its quantity and unit from one system to another.
 *
 * This is the main conversion orchestrator that routes to specialized conversion functions
 * based on the source and target systems. It handles five main conversion pathways:
 *
 * 1. Metric volumetric → americanVolumetric (ml/L → cups/tbsp/tsp)
 * 2. Weight → americanVolumetric (grams → cups, using ingredient density)
 * 3. americanVolumetric → metric (cups → grams, using ingredient density)
 * 4. americanVolumetric → imperial (cups → oz/lb, using ingredient density)
 * 5. Standard weight conversions (grams ↔ ounces/pounds/kg)
 *
 * @param {Object} ingredientObj - The ingredient object to be manipulated
 * @param {string} fromSystem - The original measurement system ('metric', 'imperial', 'americanVolumetric')
 * @param {string} toSystem - The target measurement system
 * @param {Fuse} fuse - Fuse instance for ingredient density lookups
 * @param {string} lang - Language code for unit symbols
 * @returns {Object} The converted ingredient object with updated quantity and unit
 *
 * @example
 * // Convert 2 cups of flour to metric
 * manipulateIngredient(
 *   { quantity: 2, unit: 'cup', ingredient: 'flour' },
 *   'americanVolumetric',
 *   'metric',
 *   fuseInstance,
 *   'eng'
 * )
 * // Returns: { quantity: 240, unit: 'gram', ingredient: 'flour', ... }
 */
export const manipulateIngredient = (ingredientObj, fromSystem, toSystem, fuse, lang) => {
	const { quantity, unit, ingredient, instructions } = ingredientObj
	let matchResult = null

	// Early return: No unit provided
	if (!unit) {
		return normalizeIngredient(ingredientObj, {}, lang)
	}

	// Normalize unit to standard form
	const fromUnitData = findUnitData(unit, lang)
	const fromUnit = fromUnitData?.canonical
	const unitsData = getUnitsDataForLang(lang)
	const americanVolumetricUnits = new Set(
		Object.entries(unitsData)
			.filter(
				([, data]) =>
					data.unitType === 'volume' &&
					data.skipConversion === false &&
					['americanVolumetric', 'imperial', null].includes(data.system)
			)
			.map(([canonical]) => canonical)
	)
	const requiresDensityLookup =
		toSystem === 'americanVolumetric' ||
		(fromSystem === 'americanVolumetric' && americanVolumetricUnits.has(fromUnit))

	// If coming from americanVolumetric but using weight units (e.g., ounce), mark density as unused
	if (!requiresDensityLookup && fromSystem === 'americanVolumetric') {
		matchResult = { usedDefaultDensity: false }
	}

	// Pathway 1: Metric volumetric → americanVolumetric (direct volume conversion)
	if (toSystem === 'americanVolumetric' && (fromUnit === 'milliliter' || fromUnit === 'liter')) {
		return convertMetricVolumetricToAmerican(ingredientObj, fromUnit, quantity, lang)
	}

	// Convert to grams as intermediate unit (unless already in americanVolumetric)
	let quantityInGrams = quantity
	if (fromSystem !== 'americanVolumetric') {
		const { quantity: convertedQuantity, error } = converter(quantity, fromUnit, 'grams')
		if (error) {
			return { error }
		}
		quantityInGrams = convertedQuantity
	}

	// For conversions involving americanVolumetric, we need ingredient density
	if (requiresDensityLookup) {
		// Look up ingredient density (with water as fallback and multi-word support)
		// Pass instructions for improved matching (e.g., "sliced onions" might match "onions, sliced")
		matchResult = findIngredientDensity(ingredient, fuse, instructions)
		const dryIngredient = matchResult.ingredient
		const usedDefaultDensity = matchResult.usedDefaultDensity

		// Pathway 2: Weight → americanVolumetric
		if (toSystem === 'americanVolumetric') {
			const converted = convertToAmericanVolumetric(
				ingredientObj,
				quantityInGrams,
				dryIngredient,
				usedDefaultDensity,
				lang
			)
			// Add matching metadata to result
			return {
				...converted,
				matchType: matchResult.matchType,
				matchedWord: matchResult.matchedWord,
				matchScore: matchResult.matchScore
			}
		}

		// Pathway 3: americanVolumetric → metric
		if (fromSystem === 'americanVolumetric' && toSystem === 'metric') {
			const result = convertAmericanVolumetricToMetric(
				ingredientObj,
				quantity,
				fromUnit,
				dryIngredient,
				usedDefaultDensity,
				lang
			)
			if (result) {
				// Add matching metadata to result
				return {
					...result,
					matchType: matchResult.matchType,
					matchedWord: matchResult.matchedWord,
					matchScore: matchResult.matchScore
				}
			}
			// If null, fall through to standard conversion
		}

		// Pathway 4: americanVolumetric → imperial
		if (fromSystem === 'americanVolumetric' && toSystem === 'imperial') {
			const result = convertAmericanVolumetricToImperial(
				ingredientObj,
				quantity,
				fromUnit,
				dryIngredient,
				usedDefaultDensity,
				lang
			)
			if (result) {
				// Add matching metadata to result
				return {
					...result,
					matchType: matchResult.matchType,
					matchedWord: matchResult.matchedWord,
					matchScore: matchResult.matchScore
				}
			}
			// If null, fall through to standard conversion
		}
	}

	// Pathway 5: Standard weight conversions (fallback)
	const standardResult = convertStandardWeightUnits(
		ingredientObj,
		quantity,
		fromUnit,
		toSystem,
		lang
	)
	if (standardResult?.error) return standardResult

	// Preserve match metadata if we already looked it up (e.g., ounce → gram path)
	if (matchResult) {
		return {
			...standardResult,
			matchType: standardResult.matchType ?? matchResult.matchType,
			matchedWord: standardResult.matchedWord ?? matchResult.matchedWord,
			matchScore: standardResult.matchScore ?? matchResult.matchScore,
			usedDefaultDensity: standardResult.usedDefaultDensity ?? matchResult.usedDefaultDensity
		}
	}

	return standardResult
}

// Exported for testing
export { findIngredientDensity }

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
