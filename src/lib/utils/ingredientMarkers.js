/**
 * Ingredient amount markers in recipe directions.
 *
 * Wrapping an ingredient in curly braces, e.g. "Fry the {onion}", shows that ingredient's
 * scaled, converted amount next to it in the recipe view: "Fry the onion (150 g)".
 * Unmarked mentions keep the plain highlight, so only the steps that need an amount show one.
 *
 * Syntax: `{name}`, optionally followed by `#n` to pick the nth ingredient with that name
 * (e.g. sugar for the dough and for the topping) and/or `*factor` for part of the amount
 * (`{sugar*1/2}` for "add half the sugar"). Markers that match no ingredient render as
 * their plain name.
 *
 * @module ingredientMarkers
 */

import { getPluralVariants } from './ingredientMatcher.js'
import { formatIngredientAmount } from './ingredientAmount.js'

/**
 * @typedef {Object} IngredientMarker
 * @property {string} name - The ingredient name as written in the marker
 * @property {number} occurrence - 1-based: which of several matching ingredients
 * @property {number} factor - Multiplier for the amount
 */

/**
 * @typedef {IngredientMarker & { start: number, end: number }} LocatedMarker
 */

/**
 * @typedef {Object} TextEdit
 * @property {number} start
 * @property {number} end
 * @property {string} text
 * @property {number} selectStart
 * @property {number} selectEnd
 */

/**
 * @typedef {Object} MarkerRenderOptions
 * @property {number} [scale=1] - Recipe scale factor
 * @property {boolean} [useSymbol=false] - Show unit symbols ("g") rather than names ("grams")
 * @property {string} [lang='eng'] - Recipe language, to recognize spoon units
 */

const MARKER_REGEX = /\{([^{}\n]{1,80})\}/g
const MARKER_BODY = /^(.*?)(?:\s*#\s*(\d+))?(?:\s*\*\s*(\d+(?:[.,]\d+)?)(?:\s*\/\s*(\d+))?)?$/

/**
 * Parse the text between the braces of a marker.
 *
 * @param {string} inner - e.g. "sugar#2*1/2"
 * @returns {IngredientMarker|null} null if it isn't a valid marker
 */
export function parseMarker(inner) {
	if (typeof inner !== 'string') return null
	const match = inner.trim().match(MARKER_BODY)
	if (!match) return null
	const [, rawName, rawOccurrence, rawFactor, rawDivisor] = match
	const name = rawName.trim()
	if (!name || /[<>#*]/.test(name)) return null

	const occurrence = rawOccurrence ? Number(rawOccurrence) : 1
	let factor = rawFactor ? Number(rawFactor.replace(',', '.')) : 1
	if (rawDivisor) factor /= Number(rawDivisor)
	if (!(occurrence >= 1) || !(factor > 0) || !isFinite(factor)) return null

	return { name, occurrence, factor }
}

/**
 * Find all valid markers in a text.
 *
 * @param {string} text
 * @returns {LocatedMarker[]}
 */
export function findMarkers(text) {
	if (!text || typeof text !== 'string') return []
	/** @type {LocatedMarker[]} */
	const markers = []
	for (const match of text.matchAll(MARKER_REGEX)) {
		const marker = parseMarker(match[1])
		if (marker) {
			markers.push({ ...marker, start: match.index, end: match.index + match[0].length })
		}
	}
	return markers
}

/**
 * Whether a parsed ingredient line is a Markdown heading ("# Topping") rather than an ingredient.
 *
 * @param {{ ingredient?: unknown, originalString?: unknown } | null | undefined} ing
 * @returns {boolean}
 */
export function isHeadingIngredient(ing) {
	const source = typeof ing?.originalString === 'string' ? ing.originalString : ing?.ingredient
	return typeof source === 'string' && /^\s*#/.test(source)
}

/**
 * Find the ingredient a marker refers to. Like the ingredient highlighting in the directions
 * (`matchIngredients`), a marker only matches the bare ingredient name, ignoring case and
 * plurals: `{onion}` and `{Onions}` match "onion", but `{flour}` does not match "plain flour".
 * Loose matches would silently pick the wrong one of several similar ingredients ("olive oil",
 * "sesame oil"); an unmatched marker is listed in the editor instead. `occurrence` picks the
 * nth match in ingredient order.
 *
 * @param {IngredientMarker|null} marker
 * @param {Array<{ ingredient?: unknown, originalString?: unknown }>|null|undefined} ingredients
 * @returns {number} Index into `ingredients`, or -1
 */
export function resolveMarker(marker, ingredients) {
	if (!marker || !Array.isArray(ingredients)) return -1
	const name = normalizeName(marker.name)
	const nameVariants = getPluralVariants(name)

	/** @type {number[]} */
	const matches = []
	ingredients.forEach((ing, idx) => {
		const ingName = typeof ing?.ingredient === 'string' ? normalizeName(ing.ingredient) : ''
		if (!ingName || isHeadingIngredient(ing)) return
		if (nameVariants.includes(ingName) || getPluralVariants(ingName).includes(name)) {
			matches.push(idx)
		}
	})
	return matches[marker.occurrence - 1] ?? -1
}

/**
 * Lowercase with runs of whitespace collapsed, so "Red  Onion" matches "red onion".
 *
 * @param {string} str
 * @returns {string}
 */
const normalizeName = (str) => str.trim().toLowerCase().replace(/\s+/g, ' ')

/**
 * Replace markers with their plain names, for text that leaves the recipe view
 * (search, AI prompts, image generation).
 *
 * @template {string|null|undefined} T
 * @param {T} text
 * @returns {T}
 */
export function stripIngredientMarkers(text) {
	if (!text || typeof text !== 'string') return text
	return /** @type {T} */ (
		text.replace(MARKER_REGEX, (whole, inner) => parseMarker(inner)?.name ?? whole)
	)
}

/**
 * The markers (as written) that match no ingredient, each listed once.
 *
 * @param {string} text
 * @param {Array<{ ingredient?: unknown }>} ingredients
 * @returns {string[]}
 */
export function findUnresolvedMarkers(text, ingredients) {
	const unresolved = findMarkers(text)
		.filter((marker) => resolveMarker(marker, ingredients) === -1)
		.map((marker) => text.slice(marker.start, marker.end))
	return [...new Set(unresolved)]
}

/** @param {string} str */
const escapeHtml = (str) =>
	str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')

/**
 * Render one marker as HTML: the highlighted name followed by the scaled amount of the
 * matching ingredient, or the plain name if none matches.
 *
 * @param {IngredientMarker} marker
 * @param {Array<Record<string, any>>|null} ingredients - Converted ingredients
 * @param {string|null} system - Selected measurement system
 * @param {MarkerRenderOptions} [options]
 * @returns {string}
 */
export function renderMarker(marker, ingredients, system, options = {}) {
	const { scale = 1, useSymbol = false, lang = 'eng' } = options
	const name = escapeHtml(marker.name)
	const idx = resolveMarker(marker, ingredients)
	if (idx === -1 || !ingredients) return name
	const amount = formatIngredientAmount(ingredients[idx], {
		scale: scale * marker.factor,
		system,
		useSymbol,
		lang
	})
	const amountHtml = amount ? ` <span class="whitespace-nowrap">(${escapeHtml(amount)})</span>` : ''
	return `<span class="text-primary"><b>${name}</b>${amountHtml}</span>`
}

/**
 * Format a line that may contain markers: `formatText` (temperatures, timings, highlights)
 * runs only on the text between markers, `formatMarker` on each marker, and the pieces are
 * joined. The text passes never see a marker, so they can't rewrite its amount (e.g. read
 * "1 c" as 1 °C). Whitespace next to a marker is kept out of `formatText`, as some passes trim.
 *
 * @param {string} text
 * @param {(text: string) => string} formatText
 * @param {(marker: LocatedMarker) => string} formatMarker
 * @returns {string}
 */
export function formatAroundMarkers(text, formatText, formatMarker) {
	/**
	 * @param {string} piece
	 * @param {boolean} afterMarker
	 * @param {boolean} beforeMarker
	 */
	const formatPiece = (piece, afterMarker, beforeMarker) => {
		if (!piece.trim()) return piece
		const lead = afterMarker ? piece.match(/^\s*/)[0] : ''
		const trail = beforeMarker ? piece.match(/\s*$/)[0] : ''
		return lead + formatText(piece.slice(lead.length, piece.length - trail.length)) + trail
	}

	let html = ''
	let last = 0
	for (const marker of findMarkers(text)) {
		html += formatPiece(text.slice(last, marker.start), last > 0, true) + formatMarker(marker)
		last = marker.end
	}
	return html + formatPiece(text.slice(last), last > 0, false)
}

const WORD_CHAR = /[\p{L}\p{N}'’-]/u

/**
 * The edit for the "show amount" editor button: wraps the selection (or the word at the
 * cursor) in a marker, or unwraps the marker the cursor or selection is on.
 *
 * @param {string} value - The textarea's value
 * @param {number} start - Selection start
 * @param {number} end - Selection end
 * @returns {TextEdit|null} null when there is nothing to wrap
 */
export function toggleIngredientMarker(value, start, end) {
	if (typeof value !== 'string') return null

	// Unwrap a marker the cursor is inside, or that the selection covers
	const marker = findMarkers(value).find((m) =>
		start === end
			? m.start < start && start < m.end
			: (m.start === start && m.end === end) || (m.start === start - 1 && m.end === end + 1)
	)
	if (marker) {
		const inner = value.slice(marker.start + 1, marker.end - 1)
		return {
			start: marker.start,
			end: marker.end,
			text: inner,
			selectStart: marker.start,
			selectEnd: marker.start + inner.length
		}
	}

	if (start === end) {
		// No selection: take the word around the cursor
		while (start > 0 && WORD_CHAR.test(value[start - 1])) start--
		while (end < value.length && WORD_CHAR.test(value[end])) end++
	} else {
		// Keep surrounding whitespace outside the braces
		while (start < end && /\s/.test(value[start])) start++
		while (end > start && /\s/.test(value[end - 1])) end--
	}

	const selected = value.slice(start, end)
	if (!selected || /[{}\n]/.test(selected) || !parseMarker(selected)) return null
	return {
		start,
		end,
		text: `{${selected}}`,
		selectStart: start + 1,
		selectEnd: start + 1 + selected.length
	}
}
