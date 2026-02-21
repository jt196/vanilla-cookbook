import { i18nMap } from '$lib/submodules/recipe-ingredient-parser/src/i18n'
import {
	getNutritionLocale,
	getNutritionLocalesWithFallback
} from '$lib/submodules/recipe-ingredient-parser/src/i18n/nutrition'

const splitPattern = /\s*[|;]\s*/

function normalizeText(value) {
	return String(value || '')
		.normalize('NFKD')
		.replace(/[\u0300-\u036F]/g, '')
		.toLowerCase()
		.replace(/[()\[\]{}]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

function toDisplayNumber(value) {
	if (Number.isInteger(value)) {
		return value
	}
	const rounded = Math.round(value * 100) / 100
	return Number.isInteger(rounded) ? rounded : rounded
}

function buildCanonicalAliasMap(locales) {
	const aliasMap = new Map()
	const displayMap = new Map()

	for (const locale of locales) {
		for (const [canonical, aliases] of Object.entries(locale.nutrientAliases || {})) {
			for (const alias of aliases) {
				aliasMap.set(normalizeText(alias), canonical)
			}
		}

		for (const [canonical, displayName] of Object.entries(locale.nutrientDisplayNames || {})) {
			if (!displayMap.has(canonical)) {
				displayMap.set(canonical, displayName)
			}
		}
	}

	return { aliasMap, displayMap }
}

function buildIgnoreTokens(locales) {
	const tokens = new Set()
	for (const locale of locales) {
		for (const token of locale.ignoreTokens || []) {
			tokens.add(normalizeText(token))
		}
	}
	return tokens
}

function buildPerServingPhrases(locales) {
	const phrases = new Set()
	for (const locale of locales) {
		for (const phrase of locale.perServingPhrases || []) {
			phrases.add(normalizeText(phrase))
		}
	}
	return phrases
}

function flattenLineTokens(rawText) {
	return rawText
		.split(/\r?\n/)
		.flatMap((line) => line.split(splitPattern))
		.map((token) => token.trim())
		.filter(Boolean)
}

function containsPerServing(rawText, perServingPhrases) {
	const text = normalizeText(rawText)
	for (const phrase of perServingPhrases) {
		if (text.includes(phrase)) {
			return true
		}
	}
	return false
}

function getFormat(rawText) {
	if (rawText.includes('|')) return 'kv_pipe'
	if (rawText.includes(';')) return 'sentence'
	if (rawText.includes('\n')) return 'kv_newline'
	return 'unknown'
}

function buildUnitAliases(language) {
	const aliases = new Map()
	const addAlias = (alias, canonical) => {
		if (!alias) return
		aliases.set(normalizeText(alias), canonical)
	}

	const locales = getNutritionLocalesWithFallback(language)
	const languageCodes = [language, 'eng']

	for (const lang of languageCodes) {
		const langMap = i18nMap[lang]
		if (!langMap?.unitsData) continue

		for (const unitData of Object.values(langMap.unitsData)) {
			addAlias(unitData.symbol, unitData.symbol || unitData.names?.[0])
			for (const alias of unitData.names || []) {
				addAlias(alias, unitData.symbol || alias)
			}
			addAlias(unitData.plural, unitData.symbol || unitData.plural)
		}
	}

	for (const locale of locales) {
		for (const [canonical, unitAliases] of Object.entries(locale.extraUnitAliases || {})) {
			for (const alias of unitAliases) {
				addAlias(alias, canonical)
			}
		}
	}

	// Always allow symbols, even if localized aliases are incomplete.
	for (const [canonical, symbol] of Object.entries({
		kcal: 'kcal',
		kj: 'kj',
		mg: 'mg',
		g: 'g',
		kg: 'kg',
		mcg: 'mcg',
		iu: 'iu',
		ml: 'ml',
		l: 'l',
		percent: '%'
	})) {
		if (symbol) {
			addAlias(symbol, canonical)
		}
		if (canonical === 'mcg') {
			addAlias('µg', canonical)
			addAlias('μg', canonical)
			addAlias('ug', canonical)
		}
		if (canonical === 'percent') {
			addAlias('%', canonical)
		}
	}

	for (const [canonical, unitAliases] of Object.entries(
		getNutritionLocale('eng').extraUnitAliases || {}
	)) {
		for (const alias of unitAliases) {
			addAlias(alias, canonical)
		}
	}

	return aliases
}

function tokenizeLabelAndValue(token) {
	const colonMatch = token.match(/^([^:]{2,}):\s*(.+)$/)
	if (colonMatch) {
		return {
			label: colonMatch[1].trim(),
			value: colonMatch[2].trim()
		}
	}

	const leadingValueMatch = token.match(/^([^\d%]*?)\s*(-?\d+(?:[.,]\d+)?[^\d]*)$/)
	if (leadingValueMatch && leadingValueMatch[2].match(/\d/)) {
		return {
			label: leadingValueMatch[1].trim(),
			value: leadingValueMatch[2].trim()
		}
	}

	const inlineMatch = token.match(/^(.+?)\s+(-?\d+(?:[.,]\d+)?(?:\s*[a-zA-Z%µμ]+)?)$/u)
	if (inlineMatch) {
		return {
			label: inlineMatch[1].trim(),
			value: inlineMatch[2].trim()
		}
	}

	return null
}

function parseQuantityAndUnit(value, fallbackCanonicalName = null) {
	if (!value) return { quantity: null, unit: null }

	const numberMatch = value.match(/-?\d+(?:[.,]\d+)?/)
	if (!numberMatch) {
		return { quantity: null, unit: null }
	}

	const quantity = Number(numberMatch[0].replace(',', '.'))
	if (Number.isNaN(quantity)) {
		return { quantity: null, unit: null }
	}

	let remainder = value
		.slice(numberMatch.index + numberMatch[0].length)
		.replace(/[().]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()

	const noteMatches = remainder.match(/-?\d+(?:[.,]\d+)?\s*%/g) || []
	let note = noteMatches.length ? noteMatches.join(' ') : null
	if (note) {
		remainder = remainder
			.replace(/-?\d+(?:[.,]\d+)?\s*%/g, '')
			.replace(/\s+/g, ' ')
			.trim()
	}

	let unit = remainder

	if (!unit && fallbackCanonicalName === 'calories') {
		unit = 'kcal'
	}

	if (unit.toLowerCase() === 'calories' || unit.toLowerCase() === 'calorie') {
		unit = 'kcal'
	}

	return { quantity, unit: unit || null, note }
}

function normalizeUnit(unit, unitAliases) {
	if (!unit) return null
	const normalizedUnit = normalizeText(unit)
	return unitAliases.get(normalizedUnit) || unit
}

function humanizeCanonicalName(canonicalName, displayMap) {
	if (!canonicalName) return null
	if (displayMap.has(canonicalName)) {
		return displayMap.get(canonicalName)
	}
	return canonicalName.replace(/([A-Z])/g, ' $1').replace(/^./, (match) => match.toUpperCase())
}

function shouldIgnoreToken(token, ignoreTokens) {
	const normalizedToken = normalizeText(token)
	for (const ignored of ignoreTokens) {
		if (normalizedToken.includes(ignored)) {
			return !/\d/.test(token)
		}
	}
	return false
}

function resolveCanonicalName(label, aliasMap) {
	if (!label) return null
	const normalizedLabel = normalizeText(label)

	if (aliasMap.has(normalizedLabel)) {
		return aliasMap.get(normalizedLabel)
	}

	// Prefer longer aliases first so "saturated fat(s)" resolves before generic "fat".
	const rankedAliases = [...aliasMap.entries()].sort((a, b) => b[0].length - a[0].length)

	for (const [alias, canonical] of rankedAliases) {
		if (normalizedLabel.includes(alias)) {
			return canonical
		}
	}

	return null
}

export function parseNutritionInfo(text, language = 'eng') {
	const rawText = typeof text === 'string' ? text.trim() : ''
	if (!rawText) {
		return {
			perServing: false,
			entries: [],
			format: 'unknown',
			rawText: '',
			confidence: 0
		}
	}

	const locales = getNutritionLocalesWithFallback(language)
	const { aliasMap, displayMap } = buildCanonicalAliasMap(locales)
	const ignoreTokens = buildIgnoreTokens(locales)
	const perServingPhrases = buildPerServingPhrases(locales)
	const unitAliases = buildUnitAliases(language)
	const tokens = flattenLineTokens(rawText)

	const entries = []
	let tokensWithNumbers = 0
	let parsedEntries = 0

	for (const token of tokens) {
		if (shouldIgnoreToken(token, ignoreTokens)) continue

		if (/\d/.test(token)) {
			tokensWithNumbers += 1
		}

		const parts = tokenizeLabelAndValue(token)
		if (!parts) continue

		const canonicalName = resolveCanonicalName(parts.label, aliasMap)
		const { quantity, unit, note } = parseQuantityAndUnit(parts.value, canonicalName)
		if (quantity === null) continue

		const displayName =
			humanizeCanonicalName(canonicalName, displayMap) ||
			parts.label.replace(/\s+/g, ' ').trim() ||
			token

		entries.push({
			name: displayName,
			canonicalName,
			quantity: toDisplayNumber(quantity),
			unit: normalizeUnit(unit, unitAliases),
			note,
			raw: token
		})
		parsedEntries += 1
	}

	const confidenceBase = tokensWithNumbers > 0 ? parsedEntries / tokensWithNumbers : 0
	const confidence = Math.min(1, Number(confidenceBase.toFixed(2)))

	return {
		perServing: containsPerServing(rawText, perServingPhrases),
		entries,
		format: getFormat(rawText),
		rawText,
		confidence
	}
}

export function scaleNutrition(parsed, scale = 1) {
	if (!parsed || typeof parsed !== 'object') return parsed
	if (parsed.perServing) return parsed
	if (!Number.isFinite(scale) || scale <= 0 || scale === 1) return parsed

	return {
		...parsed,
		entries: (parsed.entries || []).map((entry) => {
			if (typeof entry.quantity !== 'number') {
				return entry
			}
			return {
				...entry,
				quantity: toDisplayNumber(entry.quantity * scale)
			}
		})
	}
}

export function serializeNutritionEntries(parsedNutrition, language = 'eng') {
	if (!parsedNutrition || !Array.isArray(parsedNutrition.entries)) {
		return ''
	}

	const primaryPhrase = getNutritionLocale(language)?.perServingPhrases?.[0] || 'Per serving'
	const locales = getNutritionLocalesWithFallback(language)
	const { displayMap } = buildCanonicalAliasMap(locales)

	const body = parsedNutrition.entries
		.map((entry) => {
			const displayName =
				humanizeCanonicalName(entry.canonicalName, displayMap) ||
				entry.name ||
				entry.raw ||
				'Nutrient'
			const amount =
				typeof entry.quantity === 'number'
					? `${entry.quantity}${entry.unit ? ` ${entry.unit}` : ''}`
					: entry.raw || ''
			return `${displayName}: ${amount}${entry.note ? ` (${entry.note})` : ''}`.trim()
		})
		.filter(Boolean)
		.join('\n')

	if (!body) return ''

	if (parsedNutrition.perServing) {
		return `${primaryPhrase}\n\n${body}`
	}

	return body
}
