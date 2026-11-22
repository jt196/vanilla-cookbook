/**
 * Formatting of scaled ingredient amounts, shared by the ingredient list and the
 * ingredient amount markers in the directions.
 *
 * @module ingredientAmount
 */

import { decimalToFraction, roundIngredientQuantity } from './filters.js'

/**
 * @typedef {Object} AmountIngredient
 * @property {number|string|null} [quantity]
 * @property {number|string|null} [minQty]
 * @property {number|string|null} [maxQty]
 * @property {string|null} [unit]
 * @property {string|null} [unitPlural]
 * @property {string|null} [symbol]
 */

/**
 * A usable scale factor: anything that isn't a non-negative number becomes 1.
 *
 * @param {unknown} scale
 * @returns {number}
 */
export function normalizeScale(scale) {
	const value = parseFloat(/** @type {any} */ (scale))
	return isNaN(value) || value < 0 ? 1 : value
}

/**
 * Format a quantity (or min-max range) multiplied by `scale`: rounded decimals for metric,
 * fractions otherwise. Returns '' when there's nothing meaningful to show.
 *
 * @param {number|string|null|undefined} qty
 * @param {number|string|null|undefined} min
 * @param {number|string|null|undefined} max
 * @param {string|null|undefined} unit
 * @param {number} scale
 * @param {string|null|undefined} system - 'metric', 'imperial' or 'americanVolumetric'
 * @returns {string}
 */
export function formatScaledQuantity(qty, min, max, unit, scale, system) {
	const hasQty = qty !== null && qty !== undefined && qty !== ''
	const hasRangeValues = min !== null && min !== undefined && max !== null && max !== undefined
	const isNoUnitZeroPlaceholder =
		!unit &&
		(hasQty || hasRangeValues) &&
		Number(qty ?? 0) === 0 &&
		Number(min ?? 0) === 0 &&
		Number(max ?? 0) === 0
	if (isNoUnitZeroPlaceholder) return ''
	const hasMeaningfulRange = hasRangeValues && !(!hasQty && Number(min) === 0 && Number(max) === 0)
	if (!hasQty && !hasMeaningfulRange) return ''
	/** @param {number} value */
	const format = (value) =>
		system === 'metric' ? roundIngredientQuantity(value) : decimalToFraction(value)
	if (hasMeaningfulRange && min !== max) {
		return `${format(Number(min) * scale)}-${format(Number(max) * scale)}`
	}
	const baseQty = hasQty ? qty : hasMeaningfulRange ? min : null
	if (baseQty === null || baseQty === undefined) return ''
	return String(format(Number(baseQty) * scale))
}

/**
 * The scaled quantity used to choose between singular and plural unit names
 * (the upper bound for ranges).
 *
 * @param {AmountIngredient} ingredient
 * @param {number} scale
 * @returns {number}
 */
export function scaledQuantityForPlural(ingredient, scale) {
	const { quantity, minQty, maxQty } = ingredient
	const hasMax =
		maxQty !== null && maxQty !== undefined && !(Number(maxQty) === 0 && Number(minQty) === 0)
	const hasQty = quantity !== null && quantity !== undefined
	// The parser sets `quantity` to a range's lower bound; "1-2 cloves" follows the upper one
	if (hasMax && (!hasQty || Number(maxQty) > Number(quantity))) return Number(maxQty) * scale
	return hasQty ? Number(quantity) * scale : 0
}

/**
 * The unit to show: its symbol if preferred and known, else the singular or plural name.
 *
 * @param {AmountIngredient} ingredient
 * @param {number} qtyScaled - The scaled quantity, to pick the plural
 * @param {boolean} [useSymbol=false]
 * @returns {string}
 */
export function formatUnit(ingredient, qtyScaled, useSymbol = false) {
	if (!ingredient?.unit || ingredient.unit === 'q.b.') return ''
	if (useSymbol && ingredient.symbol) return ingredient.symbol
	const usePlural = qtyScaled > 1 && ingredient.unitPlural
	return usePlural ? /** @type {string} */ (ingredient.unitPlural) : ingredient.unit
}

/**
 * The scaled amount of an ingredient as one string, e.g. "300 g" or "1 1/2 cups".
 * Returns '' when the ingredient has no quantity.
 *
 * @param {AmountIngredient} ingredient
 * @param {{ scale?: number, system?: string|null, useSymbol?: boolean }} [options]
 * @returns {string}
 */
export function formatIngredientAmount(
	ingredient,
	{ scale = 1, system = null, useSymbol = false } = {}
) {
	if (!ingredient) return ''
	const quantity = formatScaledQuantity(
		ingredient.quantity,
		ingredient.minQty,
		ingredient.maxQty,
		ingredient.unit,
		scale,
		system
	)
	if (!quantity) return ''
	const unit = formatUnit(ingredient, scaledQuantityForPlural(ingredient, scale), useSymbol)
	return unit ? `${quantity} ${unit}` : quantity
}
