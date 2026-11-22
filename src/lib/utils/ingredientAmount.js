/**
 * Formatting of scaled ingredient amounts, shared by the ingredient list and the
 * ingredient amount markers in the directions.
 *
 * @module ingredientAmount
 */

import { decimalToFraction, roundIngredientQuantity } from './filters.js'
import { i18nMap } from '$lib/submodules/recipe-ingredient-parser/src/i18n'

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

/** @type {Map<string, Set<string>>} Lowercase spoon unit names, symbols and plurals per language */
const spoonNamesByLang = new Map()

/**
 * The lowercase names, plurals and symbols of the spoon units (teaspoon, tablespoon,
 * dessertspoon, ...) in a language, e.g. "teelöffel", "tl", "el" for German.
 *
 * @param {string} lang
 * @returns {Set<string>}
 */
function spoonNames(lang) {
	let names = spoonNamesByLang.get(lang)
	if (!names) {
		names = new Set()
		const unitsData = /** @type {Record<string, any>} */ (i18nMap[lang]?.unitsData ?? {})
		for (const [key, data] of Object.entries(unitsData)) {
			if (!key.endsWith('spoon')) continue
			for (const name of [...(data.names ?? []), data.singular, data.plural, data.symbol]) {
				if (typeof name === 'string' && name) names.add(name.toLowerCase())
			}
		}
		spoonNamesByLang.set(lang, names)
	}
	return names
}

/**
 * Whether a unit is a spoon measure (teaspoon, tablespoon, ...) in `lang` or English.
 * Spoon amounts read as fractions even in metric recipes: "¼ tsp", not "0.3 tsp".
 *
 * @param {string|null|undefined} unit
 * @param {string} [lang='eng']
 * @returns {boolean}
 */
export function isSpoonUnit(unit, lang = 'eng') {
	if (!unit || typeof unit !== 'string') return false
	const name = unit.toLowerCase()
	return spoonNames(lang).has(name) || spoonNames('eng').has(name)
}

/**
 * Format a quantity (or min-max range) multiplied by `scale`: rounded decimals for metric,
 * fractions otherwise, and fractions for spoon measures in every system.
 * Returns '' when there's nothing meaningful to show.
 *
 * @param {number|string|null|undefined} qty
 * @param {number|string|null|undefined} min
 * @param {number|string|null|undefined} max
 * @param {string|null|undefined} unit
 * @param {number} scale
 * @param {string|null|undefined} system - 'metric', 'imperial' or 'americanVolumetric'
 * @param {string} [lang='eng'] - Language of the unit name, to recognize spoon measures
 * @returns {string}
 */
export function formatScaledQuantity(qty, min, max, unit, scale, system, lang = 'eng') {
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
		system === 'metric' && !isSpoonUnit(unit, lang)
			? roundIngredientQuantity(value)
			: decimalToFraction(value)
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
 * @param {{ scale?: number, system?: string|null, useSymbol?: boolean, lang?: string }} [options]
 * @returns {string}
 */
export function formatIngredientAmount(
	ingredient,
	{ scale = 1, system = null, useSymbol = false, lang = 'eng' } = {}
) {
	if (!ingredient) return ''
	const quantity = formatScaledQuantity(
		ingredient.quantity,
		ingredient.minQty,
		ingredient.maxQty,
		ingredient.unit,
		scale,
		system,
		lang
	)
	if (!quantity) return ''
	const unit = formatUnit(ingredient, scaledQuantityForPlural(ingredient, scale), useSymbol)
	return unit ? `${quantity} ${unit}` : quantity
}
