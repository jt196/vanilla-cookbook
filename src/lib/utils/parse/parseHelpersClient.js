import { nutritionProcess } from '$lib/utils/filters'
import { durationToText } from '$lib/utils/parse/parseHelpers'

function makeCodedError(message, code = null) {
	return Object.assign(new Error(message), { code })
}

/**
 * Scrapes recipe data from a given URL.
 *
 * @param {string} url - The URL of the page to scrape.
 * @returns {Promise<Object>} A promise that resolves to an object with a success flag and either the scraped recipe data or an error message.
 *   If successful, the object contains the scraped recipe data under the `data` property.
 *   If unsuccessful, the object contains an error message under the `error` property.
 */
export async function scrapeRecipeFromURL(url) {
	const controller = new AbortController()
	const timeoutMs = 30000
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
	try {
		const response = await fetch(`/api/recipe/scrape/${encodeURIComponent(url)}`, {
			signal: controller.signal
		})
		if (response.ok) {
			const data = await response.json()
			return { success: true, data }
		} else {
			let errorData = {}
			try {
				errorData = await response.json()
			} catch {
				// Non-JSON error response
			}
			throw makeCodedError(
				normalizeScrapeErrorMessage(errorData.message || 'Error scraping recipe'),
				errorData.code || null
			)
		}
	} catch (error) {
		if (error?.name === 'AbortError') {
			console.error(`Scrape request timed out after ${timeoutMs}ms`)
			return {
				success: false,
				error: 'Request timed out. The site may be slow or unreachable.',
				code: 'recipeNew.msg.scrapeTimeout'
			}
		}
		if (error?.code) {
			return { success: false, error: normalizeScrapeErrorMessage(error.message), code: error.code }
		}
		console.error('Error scraping recipe:', error.message)
		return { success: false, error: normalizeScrapeErrorMessage(error.message) }
	} finally {
		clearTimeout(timeoutId)
	}
}

/**
 * Returns true if the URL is a YouTube video URL.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isYouTubeUrl(url) {
	try {
		const { hostname } = new URL(url)
		return hostname === 'www.youtube.com' || hostname === 'youtube.com' || hostname === 'youtu.be'
	} catch {
		return false
	}
}

/**
 * Runs the three-stage YouTube recipe extraction pipeline.
 * Calls the /api/recipe/scrape/youtube endpoint for each stage and updates
 * the caller via onProgress between stages.
 *
 * @param {Event|null} event
 * @param {string} url - YouTube video URL
 * @param {{ onProgress?: (key: string) => void, language?: string }} [options]
 * @returns {Promise<Object>} Formatted recipe object with _source and _status
 * @throws If all three stages fail to find a recipe
 */
export async function handleYouTubeScrape(event = null, url, { onProgress = () => {}, language = 'eng' } = {}) {
	if (event) event.preventDefault()

	async function callStage(stage) {
		const res = await fetch('/api/recipe/scrape/youtube', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ stage, url, language })
		})
		if (res.status === 422) {
			const err = await res.json().catch(() => ({}))
			if (err._noAi) throw makeCodedError('', err.code)
			throw makeCodedError(err.error || 'YouTube scrape failed.', err.code || null)
		}
		if (!res.ok) {
			const err = await res.json().catch(() => ({}))
			throw makeCodedError(err.error || 'YouTube scrape failed.', err.code || null)
		}
		return res.json()
	}

	// Stage 1: check description for recipe links
	onProgress('recipeNew.msg.youtubeCheckingLinks')
	const stage1 = await callStage('links')
	if (!stage1._noRecipe) {
		return { ...formatScrapedRecipe(stage1), _source: stage1._source, _status: stage1._status }
	}

	// Stage 2: AI parse the description text
	onProgress('recipeNew.msg.youtubeParsingDescription')
	const stage2 = await callStage('description')
	if (!stage2._noRecipe) {
		return { ...formatScrapedRecipe(stage2), _source: stage2._source, _status: stage2._status }
	}

	// Stage 3: AI parse the video transcript
	onProgress('recipeNew.msg.youtubeFetchingTranscript')
	const stage3 = await callStage('transcript')
	if (!stage3._noRecipe) {
		return { ...formatScrapedRecipe(stage3), _source: stage3._source, _status: stage3._status }
	}

	throw makeCodedError('Could not find a recipe in this video.', 'recipeNew.msg.youtubeNoRecipe')
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
		throw makeCodedError(normalizeScrapeErrorMessage(result.error), result.code || null)
	}
}

/**
 * Normalize scraper failures into user-facing messages.
 *
 * @param {string} message
 * @returns {string}
 */
export function normalizeScrapeErrorMessage(message) {
	if (!message) return 'Error scraping recipe.'

	if (message.includes('Upstream site returned HTTP 402')) {
		return 'This site blocked the server-side scrape request. Try the bookmarklet from the recipe page in your browser, paste the recipe text manually, or use AI parse if enabled.'
	}

	if (message.includes('Upstream site returned HTTP 403')) {
		return 'This site denied the scrape request. Try the bookmarklet from the recipe page in your browser or paste the recipe text manually.'
	}

	return message
}

/**
 * Whether a scrape error indicates the remote site blocked server-side fetching.
 *
 * @param {string} message
 * @returns {boolean}
 */
export function isBlockedScrapeErrorMessage(message) {
	return (
		typeof message === 'string' &&
		(message.includes('server-side scrape request') ||
			message.includes('Upstream site returned HTTP 402') ||
			message.includes('Upstream site returned HTTP 403'))
	)
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
			throw makeCodedError(error?.error || 'Failed to parse text.', error?.code || null)
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
			throw makeCodedError('No image provided', 'recipeNew.msg.noImage')
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
			throw makeCodedError(error?.error || 'Failed to parse image.', error?.code || null)
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
 * Handles HTML file-based recipe parsing.
 * Sends an uploaded HTML file to the backend parser without requiring AI.
 *
 * @param {Event|null} event - Optional event to prevent default form behavior
 * @param {File} file - The HTML file to parse
 * @returns {Promise<Object>} The parsed and formatted recipe object
 */
export async function handleHTMLFile(event = null, file) {
	if (event) event.preventDefault()

	try {
		if (!file) {
			throw makeCodedError('No HTML file provided', 'recipeNew.msg.noFile')
		}

		const formData = new FormData()
		formData.append('html', file)

		const response = await fetch('/api/recipe/parse/html', {
			method: 'POST',
			body: formData
		})

		if (!response.ok) {
			const error = await response.json()
			throw makeCodedError(error?.error || 'Failed to parse HTML.', error?.code || null)
		}

		const raw = await response.json()
		const formatted = formatScrapedRecipe(raw)

		return {
			...formatted,
			_source: raw._source,
			_status: raw._status
		}
	} catch (err) {
		console.error('handleHTMLFile error:', err)
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
