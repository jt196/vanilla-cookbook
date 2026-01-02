/**
 * Ingredient Matcher - Find ingredient names in direction text
 *
 * Matches ingredient names from the recipe's ingredient list and wraps them
 * in custom web component tags for interactive display.
 *
 * @module ingredientMatcher
 */

/**
 * Generate plural variants of an ingredient name
 *
 * @param {string} name - Ingredient name
 * @returns {string[]} - Array of name variants (singular + plural forms)
 */
function getPluralVariants(name) {
	if (!name || typeof name !== 'string') return []

	const lowerName = name.toLowerCase()
	const variants = [lowerName]

	// Handle irregular plurals
	const irregulars = {
		egg: 'eggs',
		leaf: 'leaves',
		knife: 'knives',
		loaf: 'loaves',
		potato: 'potatoes',
		tomato: 'tomatoes',
		cherry: 'cherries',
		strawberry: 'strawberries',
		blueberry: 'blueberries',
		cranberry: 'cranberries'
	}

	if (irregulars[lowerName]) {
		variants.push(irregulars[lowerName])
	} else {
		// Regular plural rules
		if (lowerName.endsWith('y') && !/[aeiou]y$/.test(lowerName)) {
			// cherry → cherries (but not toy → toies)
			variants.push(lowerName.slice(0, -1) + 'ies')
		} else if (
			lowerName.endsWith('s') ||
			lowerName.endsWith('x') ||
			lowerName.endsWith('z') ||
			lowerName.endsWith('ch') ||
			lowerName.endsWith('sh')
		) {
			// box → boxes
			variants.push(lowerName + 'es')
		} else {
			// Most common: add 's'
			variants.push(lowerName + 's')
		}
	}

	return variants
}

/**
 * Escape special regex characters in a string
 *
 * @param {string} str - String to escape
 * @returns {string} - Escaped string safe for regex
 */
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Match ingredient names in direction text and wrap with custom elements
 *
 * Matching strategy:
 * 1. Exact match on ingredient.ingredient property (case-insensitive)
 * 2. Plural handling: "egg" → "eggs", "cherry" → "cherries"
 * 3. Word boundaries: "butter" ≠ "butterfly"
 * 4. Longest-first: "chicken breast" before "chicken"
 * 5. Non-overlapping replacements
 *
 * Output format:
 * "Add the butter" → "Add the <vc-ingredient data-idx=\"0\" data-name=\"butter\">butter</vc-ingredient>"
 *
 * @param {string} text - Direction text
 * @param {Array<object>} ingredients - Array of ingredient objects with at least { ingredient: string }
 * @returns {string} - Text with ingredient names wrapped in custom elements
 */
export function matchIngredients(text, ingredients) {
	if (!text || typeof text !== 'string') return text
	if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) return text

	// Build list of ingredient names with their variants and indices
	const ingredientData = ingredients
		.map((ing, idx) => {
			if (!ing.ingredient || typeof ing.ingredient !== 'string') return null

			const variants = getPluralVariants(ing.ingredient)

			return {
				idx,
				name: ing.ingredient,
				variants
			}
		})
		.filter((data) => data !== null)

	if (ingredientData.length === 0) return text

	// Sort by longest name first to match "chicken breast" before "chicken"
	ingredientData.sort((a, b) => {
		const maxLengthA = Math.max(...a.variants.map((v) => v.length))
		const maxLengthB = Math.max(...b.variants.map((v) => v.length))
		return maxLengthB - maxLengthA
	})

	// Track replaced ranges to avoid overlapping replacements
	const replacedRanges = []

	/**
	 * Check if a range overlaps with any previously replaced range
	 * @param {number} start - Start index
	 * @param {number} end - End index
	 * @returns {boolean} - True if overlaps
	 */
	function overlapsExistingRange(start, end) {
		return replacedRanges.some(([rStart, rEnd]) => {
			return (start >= rStart && start < rEnd) || (end > rStart && end <= rEnd)
		})
	}

	let result = text

	// Process each ingredient (longest first)
	for (const { idx, name, variants } of ingredientData) {
		// Try each variant (singular and plural forms)
		for (const variant of variants) {
			// Build regex with word boundaries
			const pattern = new RegExp(`\\b${escapeRegex(variant)}\\b`, 'gi')

			// Find all matches
			const matches = []
			let match
			while ((match = pattern.exec(text)) !== null) {
				matches.push({
					start: match.index,
					end: match.index + match[0].length,
					matched: match[0]
				})
			}

			// Replace matches (non-overlapping only)
			for (const { start, end, matched } of matches.reverse()) {
				// Reverse to replace from end to start (preserves indices)
				if (overlapsExistingRange(start, end)) {
					continue // Skip overlapping match
				}

				// HTML-escape the ingredient name to prevent XSS
				const escapedName = name.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

				// Wrap in custom element
				const replacement = `<vc-ingredient data-idx="${idx}" data-name="${escapedName}">${matched}</vc-ingredient>`

				// Replace in result string
				result = result.slice(0, start) + replacement + result.slice(end)

				// Track this replacement
				replacedRanges.push([start, end])
			}
		}
	}

	return result
}
