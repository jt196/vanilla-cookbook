import { ERRORS } from './parseErrors.js'
import {
	getAuthor,
	getImage,
	getRating,
	parseInstructions,
	parseIngredients,
	parseVideo,
	getNutrition,
	parseJSONLD,
	getDomainFromUrl,
	parseUsingSiteConfig,
	extractMicrodata,
	cleanObjectStrings
} from './parseHelpers.js'
import { parse } from 'node-html-parser'
import { siteConfigurations } from './siteConfigurations.js'

export const SCRAPE_REQUEST_HEADERS = {
	accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
	'accept-language': 'en-US,en;q=0.9',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
}

function hasValue(value) {
	if (Array.isArray(value)) return value.length > 0
	return value !== undefined && value !== null && value !== ''
}

function hasRecipeData(recipeRaw) {
	if (!recipeRaw || typeof recipeRaw !== 'object') return false

	return Boolean(
		hasValue(recipeRaw.name) ||
			hasValue(recipeRaw.recipeIngredient) ||
			hasValue(recipeRaw.recipeInstructions) ||
			hasValue(recipeRaw.description)
	)
}

function mergeRecipeData(primary = null, fallback = null) {
	if (!fallback || typeof fallback !== 'object') return primary
	if (!primary || typeof primary !== 'object') return fallback

	const merged = { ...primary }

	for (const [key, fallbackValue] of Object.entries(fallback)) {
		if (!hasValue(merged[key]) && hasValue(fallbackValue)) {
			merged[key] = fallbackValue
		}
	}

	return merged
}

/**
 * Parses a given HTML string to extract recipe details.
 *
 * @param {string} html - The HTML content to parse.
 * @param {string} url - The URL from which the HTML was fetched.
 * @returns {Object|string} The extracted recipe details or an error message.
 */
export function parseRecipe(html, url) {
	try {
		const root = parse(html, { lowerCaseTagName: true })

		let recipeRaw = parseJSONLD(root)
		const domain = getDomainFromUrl(url)
		const siteConfig = siteConfigurations[domain]

		if (!hasValue(recipeRaw?.recipeIngredient) || !hasValue(recipeRaw?.recipeInstructions)) {
			if (siteConfig) {
				console.log('Augmenting structured data using site config')
				recipeRaw = mergeRecipeData(recipeRaw, parseUsingSiteConfig(root, siteConfig))
			}

			if (!hasValue(recipeRaw?.recipeIngredient) || !hasValue(recipeRaw?.recipeInstructions)) {
				console.log('Augmenting structured data using microdata')
				recipeRaw = mergeRecipeData(recipeRaw, extractMicrodata(root))
			}
		}

		if (!hasRecipeData(recipeRaw)) throw ERRORS.MISSING_DATA

		const author = recipeRaw.author ? getAuthor(recipeRaw.author) : domain
		const sourceUrl = recipeRaw.sourceUrl || url
		const description = recipeRaw.description
		const cookTime = recipeRaw.cookTime
		const imageUrl = getImage(recipeRaw.image)
		const keywords = Array.isArray(recipeRaw.keywords)
			? recipeRaw.keywords.map((v) => v.trim())
			: typeof recipeRaw.keywords === 'string'
				? recipeRaw.keywords.split(',').map((v) => v.trim())
				: []

		const prepTime = recipeRaw.prepTime
		const ingredients = parseIngredients(recipeRaw.recipeIngredient)
		const instructions = parseInstructions(recipeRaw.recipeInstructions)
		const category = recipeRaw.recipeCategory
		const cuisine = recipeRaw.recipeCuisine
		const rating = getRating(recipeRaw.aggregateRating)
		const totalTime = recipeRaw.totalTime
		let servings = recipeRaw.recipeYield
		if (Array.isArray(servings)) servings = servings[0]

		const video = parseVideo(recipeRaw.video)
		const nutrition = getNutrition(recipeRaw.nutrition)

		return cleanObjectStrings({
			name: recipeRaw.name,
			author,
			sourceUrl,
			description,
			cookTime,
			prepTime,
			totalTime,
			imageUrl,
			ingredients,
			instructions,
			keywords,
			category,
			cuisine,
			rating,
			servings,
			...video,
			nutrition
		})
	} catch (error) {
		console.log('Error:', error)
		return typeof error === 'string' ? error : error?.message || 'Unknown error'
	}
}

/**
 * Downloads the HTML content of a given URL.
 *
 * @param {string} url - The URL to fetch.
 * @param {number} [timeoutMs=15000] - Timeout in milliseconds.
 * @returns {Promise<string>} A promise that resolves with the HTML content.
 * @throws {Error} If the request times out or fails.
 */
export async function downloadHTML(url, timeoutMs = 15000) {
	const response = await fetchHTMLResponse(url, timeoutMs)
	if (!response.ok) {
		const error = new Error(
			`Upstream site returned HTTP ${response.status} ${response.statusText}`.trim()
		)
		error.html = response.html
		error.status = response.status
		throw error
	}
	return response.html
}

export async function fetchHTMLResponse(url, timeoutMs = 15000) {
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
	try {
		const response = await fetch(url, {
			signal: controller.signal,
			redirect: 'follow',
			headers: SCRAPE_REQUEST_HEADERS
		})
		const html = await response.text()
		return {
			ok: response.ok,
			status: response.status,
			statusText: response.statusText,
			contentType: response.headers?.get?.('content-type') || '',
			finalUrl: response.url || url,
			html
		}
	} catch (error) {
		if (error?.name === 'AbortError') {
			throw new Error(`Request timed out after ${timeoutMs}ms`)
		}
		throw error
	} finally {
		clearTimeout(timeoutId)
	}
}

/**
 * Parses a given HTML string to extract recipe details.
 *
 * @param {string} html - The HTML content to parse.
 * @param {string} url - The URL from which the HTML was fetched.
 * @returns {Promise<Object|string>} A promise that resolves with the extracted recipe details or an error message.
 */
export async function parseHTML(html, url) {
	const recipe = parseRecipe(html, url)
	return recipe
}

/**
 * Downloads and parses the HTML content of a given URL to extract recipe details.
 *
 * @param {string} url - The URL to fetch and parse.
 * @returns {Promise<Object|string>} A promise that resolves with the extracted recipe details or an error message.
 */
export async function parseURL(url) {
	const html = await downloadHTML(url)
	const parsedHTML = await parseHTML(html, url)
	return {
		parsedHTML,
		html
	}
}
