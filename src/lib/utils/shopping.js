/**
 * Shopping list helpers shared by the shopping API and UI: matching item names, recognising
 * units across languages, and merging quantities when the same item is added twice.
 *
 * @module shopping
 */

import { i18nMap } from '$lib/submodules/recipe-ingredient-parser/src/i18n'
import { scaledQuantityForPlural } from './ingredientAmount.js'
import { decodeHTMLEntities } from './filters.js'

/**
 * @typedef {Object} UnitInfo
 * @property {string} key - The parser's unit key, e.g. 'teaspoon'
 * @property {string} singular
 * @property {string} plural
 */

/** @type {Map<string, Map<string, UnitInfo>>} Lowercase unit name → unit info, per language */
const unitLookupByLang = new Map()

/**
 * Lowercase unit names, plurals and symbols in a language, mapped to the unit they name.
 *
 * @param {string} lang
 * @returns {Map<string, UnitInfo>}
 */
function unitLookup(lang) {
	let lookup = unitLookupByLang.get(lang)
	if (!lookup) {
		lookup = new Map()
		const unitsData = /** @type {Record<string, any>} */ (i18nMap[lang]?.unitsData ?? {})
		for (const [key, data] of Object.entries(unitsData)) {
			const info = { key, singular: data.singular ?? key, plural: data.plural ?? key }
			for (const name of [data.singular, data.plural, data.symbol, ...(data.names ?? [])]) {
				if (typeof name === 'string' && name && !lookup.has(name.toLowerCase())) {
					lookup.set(name.toLowerCase(), info)
				}
			}
		}
		unitLookupByLang.set(lang, lookup)
	}
	return lookup
}

/**
 * The unit a unit string names, looked up in `lang` and then English.
 *
 * @param {string|null|undefined} unit
 * @param {string} [lang='eng']
 * @returns {UnitInfo|null}
 */
export function findUnit(unit, lang = 'eng') {
	if (!unit || typeof unit !== 'string') return null
	const name = unit.trim().toLowerCase()
	return unitLookup(lang).get(name) ?? unitLookup('eng').get(name) ?? null
}

/**
 * The unit name to show for a quantity: plural above 1, singular otherwise. Units the parser
 * doesn't know are returned as they are.
 *
 * @param {string|null|undefined} unit
 * @param {number|null|undefined} quantity
 * @param {string} [lang='eng']
 * @returns {string}
 */
export function shoppingUnitLabel(unit, quantity, lang = 'eng') {
	if (!unit) return ''
	const info = findUnit(unit, lang)
	if (!info) return unit
	return Number(quantity) > 1 ? info.plural : info.singular
}

/**
 * The singular form of a unit, for storage. Unknown units are kept as they are.
 *
 * @param {string|null|undefined} unit
 * @param {string} [lang='eng']
 * @returns {string|null}
 */
export function singularUnit(unit, lang = 'eng') {
	if (!unit || typeof unit !== 'string' || !unit.trim()) return null
	return findUnit(unit, lang)?.singular ?? unit.trim()
}

/**
 * A key that two units share when their quantities can be added: the parser's unit key,
 * the lowercased unit for unknown units, or '' for no unit.
 *
 * @param {string|null|undefined} unit
 * @param {string} [lang='eng']
 * @returns {string}
 */
export function unitKey(unit, lang = 'eng') {
	if (!unit || typeof unit !== 'string' || !unit.trim()) return ''
	return findUnit(unit, lang)?.key ?? unit.trim().toLowerCase()
}

/**
 * Normalise an item name so that "Onions", " onion " and "onion" match: lowercase, single
 * spaces, and a simple English plural "s"/"es" dropped from the last word.
 *
 * @param {string|null|undefined} name
 * @returns {string}
 */
export function normalizeItemName(name) {
	if (!name || typeof name !== 'string') return ''
	const words = name.trim().toLowerCase().replace(/\s+/g, ' ').split(' ')
	const last = words[words.length - 1]
	if (/(ch|sh|x|ss|o)es$/.test(last) && last.length > 4) {
		words[words.length - 1] = last.slice(0, -2)
	} else if (last.endsWith('ies') && last.length > 4) {
		words[words.length - 1] = `${last.slice(0, -3)}y`
	} else if (last.endsWith('s') && !last.endsWith('ss') && last.length > 3) {
		words[words.length - 1] = last.slice(0, -1)
	}
	return words.join(' ')
}

/**
 * Round a quantity to at most two decimal places, keeping null as null.
 *
 * @param {number|null|undefined} quantity
 * @returns {number|null}
 */
export function roundShoppingQuantity(quantity) {
	if (quantity === null || quantity === undefined || Number.isNaN(Number(quantity))) return null
	return Math.round(Number(quantity) * 100) / 100
}

/**
 * @typedef {Object} ShoppingRow
 * @property {string} uid
 * @property {string} name
 * @property {number|null} quantity
 * @property {string|null} unit
 * @property {boolean} purchased
 */

/**
 * @typedef {Object} MergePlan
 * @property {'create'|'update'} action
 * @property {string} [uid] - The row to update, when `action` is 'update'
 * @property {number|null} quantity - The quantity to store
 * @property {string|null} unit - The unit to store
 */

/**
 * Decide how to add an item to a list without creating duplicates. An item that matches a
 * row by name is merged into it:
 * - a purchased row (one from your history) is put back on the list with the new amount;
 * - a row still to buy gets the amounts added when the units match (or neither has a unit
 *   or quantity). If the units can't be combined, a separate row is created.
 *
 * @param {ShoppingRow[]} rows - The user's rows with the same normalised name
 * @param {{ quantity: number|null, unit: string|null }} item - The item being added
 * @param {string} [lang='eng']
 * @returns {MergePlan}
 */
export function planShoppingMerge(rows, item, lang = 'eng') {
	const key = unitKey(item.unit, lang)
	const toBuy = rows.filter((row) => !row.purchased)
	const sameUnit = toBuy.find((row) => unitKey(row.unit, lang) === key)
	if (sameUnit) {
		const quantity =
			sameUnit.quantity === null && item.quantity === null
				? null
				: roundShoppingQuantity((sameUnit.quantity ?? 0) + (item.quantity ?? 0))
		return { action: 'update', uid: sameUnit.uid, quantity, unit: sameUnit.unit ?? item.unit }
	}
	const noAmount = toBuy.find((row) => row.quantity === null && !row.unit)
	if (noAmount) {
		return { action: 'update', uid: noAmount.uid, quantity: item.quantity, unit: item.unit }
	}
	if (toBuy.length > 0) return { action: 'create', quantity: item.quantity, unit: item.unit }
	const history = rows.find((row) => unitKey(row.unit, lang) === key) ?? rows[0]
	if (history) {
		return { action: 'update', uid: history.uid, quantity: item.quantity, unit: item.unit }
	}
	return { action: 'create', quantity: item.quantity, unit: item.unit }
}

/**
 * @typedef {Object} ShoppingPayload
 * @property {string} ingredient - The item name
 * @property {number|null} quantity
 * @property {string|null} unit - The singular unit
 * @property {string|null} recipeUid
 */

/**
 * The shopping list item for a parsed (and unit-converted) recipe ingredient at a scale:
 * the scaled quantity (a range's upper bound), the singular unit and a plain-text name.
 *
 * @param {import('./ingredientAmount.js').AmountIngredient & { ingredient?: string|null }} ingredient
 * @param {number} scale
 * @param {string|null} [recipeUid=null]
 * @returns {ShoppingPayload}
 */
export function shoppingItemFromIngredient(ingredient, scale, recipeUid = null) {
	const hasAmount = [ingredient.quantity, ingredient.maxQty].some(
		(value) => value !== null && value !== undefined && value !== ''
	)
	const quantity = hasAmount
		? roundShoppingQuantity(scaledQuantityForPlural(ingredient, scale))
		: null
	return {
		// Parsed names can hold HTML entities ("sott&#39;olio"); store plain text
		ingredient: decodeHTMLEntities(ingredient.ingredient ?? '').trim(),
		quantity: quantity === 0 ? null : quantity,
		unit: ingredient.unit && ingredient.unit !== 'q.b.' ? ingredient.unit : null,
		recipeUid
	}
}
