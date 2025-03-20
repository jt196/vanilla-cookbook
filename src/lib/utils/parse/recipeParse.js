import { ERRORS } from './parseErrors'
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
	extractMicrodata
} from './parseHelpers'
import { parse } from 'node-html-parser'
import { siteConfigurations } from './siteConfigurations'

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

		if (!recipeRaw || !recipeRaw.recipeIngredient) {
			const siteConfig = siteConfigurations[domain]
			if (siteConfig) {
				console.log('Extracting using site config')
				recipeRaw = parseUsingSiteConfig(root, siteConfig)
			} else {
				console.log('Extracting using microdata')
				recipeRaw = extractMicrodata(root)
			}
		}
		if (!recipeRaw.recipeIngredient) throw ERRORS.MISSING_DATA

		const author = recipeRaw.author ? getAuthor(recipeRaw.author) : domain
		const sourceUrl = url
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

		return {
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
		}
	} catch (error) {
		console.log('Error:', error)
		return typeof error === 'string' ? error : 'Unknown error'
	}
}

/**
 * Downloads the HTML content of a given URL.
 *
 * @param {string} url - The URL to fetch.
 * @returns {Promise<string>} A promise that resolves with the HTML content.
 */
export async function downloadHTML(url) {
	const response = await fetch(url)
	return response.text()
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
