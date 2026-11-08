import { safeFetch } from '$lib/server/safeFetch'
import { ERRORS } from './parseErrors.js'
import {
	getAuthor,
	getImage,
	getRating,
	parseInstructions,
	parseIngredients,
	parseKeywords,
	parseVideo,
	parseTools,
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

const hasValue = (value) =>
	Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== ''

/** Raw data is usable once it has ingredients and instructions; no need to try more sources. */
const isComplete = (raw) => hasValue(raw?.recipeIngredient) && hasValue(raw?.recipeInstructions)

/** Fill empty fields of `primary` from `fallback`. */
function fillMissing(primary, fallback) {
	if (!primary) return fallback
	const merged = { ...primary }
	for (const [key, value] of Object.entries(fallback)) {
		if (!hasValue(merged[key]) && hasValue(value)) merged[key] = value
	}
	return merged
}

/**
 * Collect raw schema.org-shaped recipe data from a page, trying each source in turn until
 * ingredients and instructions are both found: JSON-LD, then the site's CSS selector
 * config (if any), then microdata. Later sources only fill fields earlier ones left empty.
 *
 * @param {import('node-html-parser').HTMLElement} root
 * @param {Object | undefined} siteConfig
 * @returns {Object | null}
 */
function extractRawRecipe(root, siteConfig) {
	const fallbacks = [
		siteConfig && (() => parseUsingSiteConfig(root, siteConfig)),
		() => extractMicrodata(root)
	].filter(Boolean)

	let raw = parseJSONLD(root)
	for (const extract of fallbacks) {
		if (isComplete(raw)) break
		raw = fillMissing(raw, extract())
	}
	return raw
}

/**
 * Map raw schema.org fields to the recipe shape the app uses.
 *
 * @param {Object} raw - Raw Recipe data.
 * @param {string} url - Page URL, used as the source URL if the data has none.
 * @param {string} domain - Page domain, used as the author if the data has none.
 */
function toRecipe(raw, url, domain) {
	return {
		name: raw.name,
		author: raw.author ? getAuthor(raw.author) : domain,
		sourceUrl: raw.sourceUrl || url,
		description: raw.description,
		cookTime: raw.cookTime,
		prepTime: raw.prepTime,
		totalTime: raw.totalTime,
		imageUrl: getImage(raw.image),
		ingredients: parseIngredients(raw.recipeIngredient),
		instructions: parseInstructions(raw.recipeInstructions),
		keywords: parseKeywords(raw.keywords),
		category: raw.recipeCategory,
		cuisine: raw.recipeCuisine,
		rating: getRating(raw.aggregateRating),
		servings: [raw.recipeYield].flat()[0],
		...parseVideo(raw.video),
		nutrition: raw.nutrition || undefined,
		equipment: parseTools(raw.tool)
	}
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
		const domain = getDomainFromUrl(url)
		const raw = extractRawRecipe(root, siteConfigurations[domain])

		const hasAnyData = ['name', 'recipeIngredient', 'recipeInstructions', 'description'].some(
			(field) => hasValue(raw?.[field])
		)
		if (!hasAnyData) throw ERRORS.MISSING_DATA

		return cleanObjectStrings(toRecipe(raw, url, domain))
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
		const response = await safeFetch(url, {
			signal: controller.signal,
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
			throw new Error(`Request timed out after ${timeoutMs}ms`, { cause: error })
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
