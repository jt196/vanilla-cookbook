import { nutritionProcess } from '$lib/utils/filters'
import { durationToText } from '$lib/utils/parse/parseHelpers'

/**
 * Scrapes recipe data from a given URL.
 *
 * @param {string} url - The URL of the page to scrape.
 * @returns {Promise<Object>} A promise that resolves to an object with a success flag and either the scraped recipe data or an error message.
 *   If successful, the object contains the scraped recipe data under the `data` property.
 *   If unsuccessful, the object contains an error message under the `error` property.
 */
export async function scrapeRecipeFromURL(url) {
	try {
		const response = await fetch(`/api/recipe/scrape/${encodeURIComponent(url)}`)
		if (response.ok) {
			const data = await response.json()
			return { success: true, data }
		} else {
			const errorData = await response.json()
			throw new Error(errorData.message || 'Error scraping recipe')
		}
	} catch (error) {
		console.error('Error scraping recipe:', error.message)
		return { success: false, error: error.message }
	}
}

/**
 * Handles the scraping of a recipe from a given URL.
 * Optionally prevents the default behavior of a passed event.
 *
 * @param {Event|null} event - The optional event to prevent default on.
 * @param {string} url - The URL from which to scrape the recipe.
 * @returns {Promise<Object>} A promise that resolves to an object containing the formatted recipe data,
 *   along with `_source` and `_status` properties from the raw data.
 * @throws Will throw an error if the scraping fails.
 */
export async function handleScrape(event = null, url) {
	if (event) event.preventDefault()

	const result = await scrapeRecipeFromURL(url)

	if (result.success) {
		const raw = result.data
		const formatted = formatScrapedRecipe(raw)

		// Preserve _source and _status from raw
		return {
			...formatted,
			_source: raw._source,
			_status: raw._status
		}
	} else {
		console.error('Error:', result.error)
		throw result.error
	}
}

/**
 * Parses text for recipe data.
 * Optionally prevents the default behavior of a passed event.
 *
 * @param {Event|null} event - The optional event to prevent default on.
 * @param {string} text - The text to parse for recipe data.
 * @param {Object} [options]
 * @param {'parse'|'prompt'} [options.mode='parse'] - Whether to parse pasted text or generate from prompt
 * @param {string} [options.unitsPreference] - Preferred units for generated recipes (e.g., 'metric' or 'us')
 * @param {string} [options.language='eng'] - Language code for recipe (eng, deu, ita, etc.)
 * @returns {Promise<Object>} A promise that resolves to an object containing the formatted recipe data,
 *   along with `_source` and `_status` properties from the raw data.
 * @throws Will throw an error if the parsing fails.
 */
export async function handleParse(
	event = null,
	text,
	{ mode = 'parse', unitsPreference, language = 'eng' } = {}
) {
	if (event) event.preventDefault()

	try {
		const response = await fetch('/api/recipe/parse', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ text, mode, unitsPreference, language })
		})

		if (!response.ok) {
			const error = await response.json()
			throw new Error(error?.error || 'Failed to parse text.')
		}

		const raw = await response.json()
		const formatted = formatScrapedRecipe(raw)

		return {
			...formatted,
			_source: raw._source,
			_status: raw._status
		}
	} catch (err) {
		console.error('handleParse error:', err)
		throw err
	}
}

/**
 * Handles image-based recipe parsing.
 * Sends image to the backend and formats the result.
 *
 * @param {Event|null} event - Optional event to prevent default form behavior
 * @param {File|File[]} imageInput - The image file(s) selected from an <input type="file">
 * @param {string} [language='eng'] - Language code for recipe (eng, deu, ita, etc.)
 * @returns {Promise<Object>} The parsed and formatted recipe object
 */
export async function handleImage(event = null, imageInput, language = 'eng') {
	if (event) event.preventDefault()

	try {
		const files = Array.isArray(imageInput) ? imageInput : imageInput ? [imageInput] : []

		if (!files.length) {
			throw new Error('No image provided')
		}

		const formData = new FormData()
		files.slice(0, 5).forEach((file) => formData.append('image', file))
		formData.append('language', language)

		const response = await fetch('/api/recipe/parse/image', {
			method: 'POST',
			body: formData
		})

		if (!response.ok) {
			const error = await response.json()
			throw new Error(error?.error || 'Failed to parse image.')
		}

		const raw = await response.json()
		const formatted = formatScrapedRecipe(raw)

		return {
			...formatted,
			_source: raw._source,
			_status: raw._status
		}
	} catch (err) {
		console.error('handleImage error:', err)
		throw err
	}
}

/**
 * Reusable formatting function for both methods
 * Formats scraped recipe data into a standardized object.
 *
 * @param {Object} raw - The scraped recipe data.
 * @returns {Object} The formatted recipe data.
 */
export function formatScrapedRecipe(raw) {
	return {
		name: raw.name,
		source: raw.author,
		source_url: raw.sourceUrl,
		cook_time: durationToText(raw.cookTime),
		image_url: raw.imageUrl,
		prep_time: durationToText(raw.prepTime),
		ingredients: Array.isArray(raw.ingredients) ? raw.ingredients.join('\n') : raw.ingredients,
		directions: Array.isArray(raw.instructions) ? raw.instructions.join('\n\n') : raw.instructions,
		description: Array.isArray(raw.description) ? raw.description.join('\n\n') : raw.description,
		total_time: durationToText(raw.totalTime),
		servings: Array.isArray(raw.servings) ? raw.servings[0] : raw.servings,
		nutritional_info: nutritionProcess(raw.nutrition)
	}
}
