import { units, findSuitableUnit } from '$lib/utils/units'

/**
 * Takes the quantity of the original unit and converts it to another given unit.
 *
 * @param {number} quantity - The quantity of the 'from' unit.
 * @param {string} from - The original unit to be converted.
 * @param {string} [to='grams'] - The unit to be converted to.
 * @returns {{quantity: number, unit: string} | {error: string}} - Returns an object containing either the converted quantity and unit or an error message.
 */
const converter = (quantity, from, to = 'grams') => {
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

const systemToUnitsMap = {
	metric: ['gram', 'kilogram', 'liter', 'milliliter'],
	imperial: ['fluid ounce', 'pound', 'gallon'],
	americanVolumetric: ['cup']
}

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

// export function manipulateIngredient(ingredientObj, toUnit) {
// 	// eslint-disable-next-line no-unused-vars
// 	const { quantity, unit, unitPlural, symbol, ingredient, minQty, maxQty } = ingredientObj

// 	const conversionResult = converter(quantity, unit, toUnit)

// 	if (conversionResult.error) {
// 		return { error: conversionResult.error }
// 	}

// 	const newQuantity = conversionResult.quantity
// 	const newUnit = conversionResult.unit

// 	// You might want to add logic here to determine the new unitPlural and symbol based on the new unit
// 	const newUnitPlural = newUnit + 's' // Simplified example
// 	const newSymbol = newUnit.charAt(0) // Simplified example

// 	return {
// 		quantity: newQuantity,
// 		unit: newUnit,
// 		unitPlural: newUnitPlural,
// 		symbol: newSymbol,
// 		ingredient: `${newQuantity} ${newUnitPlural} of ${ingredient.split(' ')[1]}`,
// 		minQty: newQuantity, // You might want to convert this too
// 		maxQty: newQuantity // You might want to convert this too
// 	}
// }

export const manipulateIngredient = (ingredientObj, toSystem) => {
	const { quantity, unit } = ingredientObj

	// If no unit is provided, return the original ingredientObj
	if (!unit) {
		return ingredientObj
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
		unit: target.unit,
		unitPlural: target.unit + 's', // Simplified
		symbol: target.unit.charAt(0), // Simplified
		minQty: roundedQuantity,
		maxQty: roundedQuantity
	}
}
