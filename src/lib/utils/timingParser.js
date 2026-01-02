import { i18nMap } from '$lib/submodules/recipe-ingredient-parser/src/i18n'

/**
 * Parse timing expressions in direction text (multilanguage)
 *
 * Detects patterns like:
 * - Single times: "30 minutes", "1 hour", "45 seconds"
 * - Ranges: "1-2 hours", "30 to 45 minutes"
 * - Compound: "2 hours 30 minutes"
 *
 * Uses i18n unit data to support all 10 languages automatically.
 *
 * @param {string} text - Direction text
 * @param {string} lang - Language code (eng, deu, ita, etc.)
 * @returns {string} - Text with timings wrapped in <span class="text-primary">
 */
export function parseTimings(text, lang = 'eng') {
	if (!text || typeof text !== 'string') return text

	const langData = i18nMap[lang] ?? i18nMap.eng
	const unitsData = langData.unitsData

	// Get all time units from unitsData
	const timeUnits = Object.entries(unitsData)
		.filter(([key, data]) => data.unitType === 'time')
		.map(([key, data]) => ({
			canonical: key,
			names: data.names,
			symbol: data.symbol
		}))

	// If no time units found, return original text
	if (timeUnits.length === 0) return text

	// Build regex from all time unit names across all time units
	// Escape special regex characters in unit names
	const allTimeWords = timeUnits
		.flatMap((unit) => unit.names)
		.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

	if (allTimeWords.length === 0) return text

	// Get language-specific joiners and conjunction words
	const joiners = langData.joiners || ['to', 'or'] // Fallback to English
	const additionalStopwords = langData.additionalStopwords || ['and', 'or'] // Fallback to English

	// Escape special regex characters in joiners and stopwords
	const escapedJoiners = joiners.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
	const escapedStopwords = additionalStopwords.map((word) =>
		word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	)

	// Pattern matches:
	// - Number (with optional decimal)
	// - Optional range separator (-, –, or language-specific joiners)
	// - Optional second number
	// - Time unit word
	// - Optional compound time (e.g., "2 hours 30 minutes") with language-specific conjunction
	const rangePattern = escapedJoiners.length > 0 ? `|${escapedJoiners.join('|')}` : ''
	const conjunctionPattern =
		escapedStopwords.length > 0 ? `(?:${escapedStopwords.join('|')}\\s+)?` : ''

	const timePattern = `\\b(\\d+(?:[.,]\\d+)?(?:\\s*(?:[-–]${rangePattern})\\s*\\d+(?:[.,]\\d+)?)?)\\s*(${allTimeWords.join('|')})(?:\\s+${conjunctionPattern}(\\d+)\\s*(${allTimeWords.join('|')}))?\\b`
	const regex = new RegExp(timePattern, 'gi')

	// Replace matches with styled spans
	return text.replace(regex, (match) => {
		return `<span class="text-primary">${match}</span>`
	})
}
