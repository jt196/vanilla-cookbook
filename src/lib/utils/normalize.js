/**
 * Input normalization utilities for API endpoints
 * Provides consistent handling of strings, numbers, and field aliasing
 */

/**
 * Normalizes a string value - trims whitespace, returns null for empty/invalid
 * @param {unknown} value - Value to normalize
 * @returns {string | null} - Trimmed string or null
 */
export function normalizeString(value) {
	if (typeof value !== 'string') return null
	const trimmed = value.trim()
	return trimmed.length > 0 ? trimmed : null
}

/**
 * Normalizes a numeric value
 * @param {unknown} value - Value to normalize
 * @returns {{ value: number | null, valid: boolean }} - Object with normalized value and validity flag
 *
 * @example
 * normalizeNumber('')        // { value: null, valid: true }  - empty is OK
 * normalizeNumber(null)      // { value: null, valid: true }  - null is OK
 * normalizeNumber('abc')     // { value: null, valid: false } - invalid input
 * normalizeNumber('42')      // { value: 42, valid: true }
 * normalizeNumber(3.14)      // { value: 3.14, valid: true }
 */
export function normalizeNumber(value) {
	if (value === '' || value === null || value === undefined) {
		return { value: null, valid: true }
	}
	const parsed = Number(value)
	if (Number.isNaN(parsed)) {
		return { value: null, valid: false }
	}
	return { value: parsed, valid: true }
}

/**
 * Normalizes a boolean value
 * @param {unknown} value - Value to normalize
 * @returns {boolean | null} - Boolean or null for non-boolean input
 */
export function normalizeBoolean(value) {
	if (typeof value === 'boolean') return value
	if (value === 'true') return true
	if (value === 'false') return false
	return null
}

/**
 * Converts value to string, returns null for empty/null/undefined
 * Useful for fields stored as strings but may arrive as numbers (e.g., times, servings)
 * @param {unknown} value - Value to convert
 * @returns {string | null} - String representation or null
 *
 * @example
 * normalizeToString(30)        // '30'
 * normalizeToString('30 min')  // '30 min'
 * normalizeToString('')        // null
 * normalizeToString(null)      // null
 * normalizeToString(0)         // '0'
 */
export function normalizeToString(value) {
	if (value === null || value === undefined || value === '') return null
	return String(value)
}

/**
 * Picks the first defined (non-null, non-undefined) value from candidates
 * Useful for field aliasing when APIs accept multiple field names
 * @param {...unknown} values - Values to check
 * @returns {unknown} - First defined value, or undefined if none
 *
 * @example
 * pickFirst(data.ingredient, data.name)  // returns whichever is defined first
 * pickFirst(null, undefined, 'hello')    // returns 'hello'
 */
export function pickFirst(...values) {
	for (const v of values) {
		if (v !== undefined && v !== null) return v
	}
	return undefined
}
