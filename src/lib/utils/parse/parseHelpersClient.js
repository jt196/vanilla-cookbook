import { nutritionProcess } from '$lib/utils/filters'
import { durationToText } from '$lib/utils/parse/parseHelpers'

// Long enough for the server's AI fallback, which can take a minute or more
const SCRAPE_TIMEOUT_MS = 120000

const YOUTUBE_STAGES = [
	['links', 'recipeNew.msg.youtubeCheckingLinks'], // recipe pages linked in the description
	['description', 'recipeNew.msg.youtubeParsingDescription'], // AI reads the description
	['transcript', 'recipeNew.msg.youtubeFetchingTranscript'] // AI reads the transcript
]

function makeCodedError(message, code = null) {
	return Object.assign(new Error(message), { code })
}

/** Format a parsed recipe for the form, keeping the server's `_source` and `_status`. */
const toFormRecipe = (raw) => ({
	...formatScrapedRecipe(raw),
	_source: raw._source,
	_status: raw._status
})

/** Read a JSON error body, or `{}` if the body isn't JSON. */
const errorBody = (response) => response.json().catch(() => ({}))

/**
 * POST to a recipe parsing endpoint and return the parsed JSON.
 * @throws {Error & { code: string | null }} The server's `error` and `code` on failure.
 */
async function postForRecipe(url, init, fallbackMessage) {
	const response = await fetch(url, { method: 'POST', ...init })
	if (!response.ok) {
		const body = await errorBody(response)
		throw makeCodedError(body.error || fallbackMessage, body.code || null)
	}
	return response.json()
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
 * Returns true if the URL is a YouTube video URL.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isYouTubeUrl(url) {
	try {
		const { hostname } = new URL(url)
		return ['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be'].includes(hostname)
	} catch {
		return false
	}
}

/**
 * Scrape a recipe from a web page URL (the server falls back to AI when it can).
 *
 * @param {Event|null} event - Optional event to prevent default on.
 * @param {string} url - The recipe page URL.
 * @returns {Promise<Object>} Form-ready recipe with `_source` and `_status`.
 * @throws {Error & { code?: string | null }} With a user-facing message.
 */
export async function handleScrape(event = null, url) {
	if (event) event.preventDefault()

	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS)
	try {
		const response = await fetch(`/api/recipe/scrape/${encodeURIComponent(url)}`, {
			signal: controller.signal
		})
		if (!response.ok) {
			const body = await errorBody(response)
			throw makeCodedError(body.message || 'Error scraping recipe', body.code || null)
		}
		return toFormRecipe(await response.json())
	} catch (error) {
		if (error?.name === 'AbortError') {
			throw makeCodedError(
				'Request timed out. The site may be unreachable, or AI extraction took too long. Try again or paste the recipe text.',
				'recipeNew.msg.scrapeTimeout'
			)
		}
		console.error('Error scraping recipe:', error.message)
		throw makeCodedError(normalizeScrapeErrorMessage(error.message), error.code || null)
	} finally {
		clearTimeout(timeoutId)
	}
}

/**
 * Extract a recipe from a YouTube video, trying each stage in turn (linked recipe pages,
 * then AI on the description, then AI on the transcript) until one finds a recipe.
 *
 * @param {Event|null} event
 * @param {string} url - YouTube video URL
 * @param {{ onProgress?: (key: string) => void, language?: string }} [options]
 * @returns {Promise<Object>} Form-ready recipe with `_source` and `_status`.
 * @throws If no stage finds a recipe, or AI is unavailable (empty message + code).
 */
export async function handleYouTubeScrape(
	event = null,
	url,
	{ onProgress = () => {}, language = 'eng' } = {}
) {
	if (event) event.preventDefault()

	for (const [stage, progressKey] of YOUTUBE_STAGES) {
		onProgress(progressKey)
		const response = await fetch('/api/recipe/scrape/youtube', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ stage, url, language })
		})
		if (!response.ok) {
			const body = await errorBody(response)
			// No AI configured: the caller shows its own message for this code
			const message = body._noAi ? '' : body.error || 'YouTube scrape failed.'
			throw makeCodedError(message, body.code || null)
		}
		const result = await response.json()
		if (!result._noRecipe) return toFormRecipe(result)
	}

	throw makeCodedError('Could not find a recipe in this video.', 'recipeNew.msg.youtubeNoRecipe')
}

/**
 * Parse pasted text with AI (`mode: 'parse'`) or generate a recipe from a prompt
 * (`mode: 'prompt'`).
 *
 * @param {Event|null} event - Optional event to prevent default on.
 * @param {string} text
 * @param {{ mode?: 'parse'|'prompt', unitsPreference?: string, language?: string }} [options]
 * @returns {Promise<Object>} Form-ready recipe with `_source` and `_status`.
 */
export async function handleParse(
	event = null,
	text,
	{ mode = 'parse', unitsPreference, language = 'eng' } = {}
) {
	if (event) event.preventDefault()
	const raw = await postForRecipe(
		'/api/recipe/parse',
		{
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text, mode, unitsPreference, language })
		},
		'Failed to parse text.'
	)
	return toFormRecipe(raw)
}

/**
 * Parse a recipe from up to 5 photos with AI.
 *
 * @param {Event|null} event - Optional event to prevent default on.
 * @param {File|File[]} imageInput - The selected image file(s).
 * @param {string} [language='eng']
 * @returns {Promise<Object>} Form-ready recipe with `_source` and `_status`.
 */
export async function handleImage(event = null, imageInput, language = 'eng') {
	if (event) event.preventDefault()

	const files = [imageInput].flat().filter(Boolean)
	if (!files.length) throw makeCodedError('No image provided', 'recipeNew.msg.noImage')

	const formData = new FormData()
	files.slice(0, 5).forEach((file) => formData.append('image', file))
	formData.append('language', language)

	return toFormRecipe(
		await postForRecipe('/api/recipe/parse/image', { body: formData }, 'Failed to parse image.')
	)
}

/**
 * Parse a saved HTML page (no AI needed).
 *
 * @param {Event|null} event - Optional event to prevent default on.
 * @param {File} file - The HTML file.
 * @returns {Promise<Object>} Form-ready recipe with `_source` and `_status`.
 */
export async function handleHTMLFile(event = null, file) {
	if (event) event.preventDefault()
	if (!file) throw makeCodedError('No HTML file provided', 'recipeNew.msg.noFile')

	const formData = new FormData()
	formData.append('html', file)

	return toFormRecipe(
		await postForRecipe('/api/recipe/parse/html', { body: formData }, 'Failed to parse HTML.')
	)
}

/**
 * Formats parsed recipe data (from the scraper or AI) into the recipe form's fields.
 *
 * @param {Object} raw - The parsed recipe data.
 * @returns {Object} The formatted recipe data.
 */
export function formatScrapedRecipe(raw) {
	const lines = (value, separator) => (Array.isArray(value) ? value.join(separator) : value)
	return {
		name: raw.name,
		source: raw.author,
		source_url: raw.sourceUrl,
		cook_time: durationToText(raw.cookTime),
		image_url: raw.imageUrl,
		prep_time: durationToText(raw.prepTime),
		ingredients: lines(raw.ingredients, '\n'),
		directions: lines(raw.instructions, '\n\n'),
		description: lines(raw.description, '\n\n'),
		total_time: durationToText(raw.totalTime),
		servings: Array.isArray(raw.servings) ? raw.servings[0] : raw.servings,
		nutritional_info: nutritionProcess(raw.nutrition),
		equipment: lines(raw.equipment, '\n') || ''
	}
}
