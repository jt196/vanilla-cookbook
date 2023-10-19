import { ERRORS } from './parseErrors'
import {
	durationToText,
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
		const root = parse(html, {
			lowerCaseTagName: true
		})

		// 1. Attempt to parse using JSON-LD
		let recipeRaw = parseJSONLD(root)
		const domain = getDomainFromUrl(url)
		// 2. Check siteConfig for domain-specific parsing
		if (!recipeRaw || !recipeRaw.recipeIngredient) {
			// Check if the siteUrl is in your configurations
			const siteConfig = siteConfigurations[domain]
			if (siteConfig) {
				console.log('Extracting using site config')
				// Use the backup extraction method
				recipeRaw = parseUsingSiteConfig(root, siteConfig)
			} else {
				// 3. Attempt to parse using microdata
				console.log('Extracting using microdata')
				recipeRaw = extractMicrodata(root)
			}
		}
		if (!recipeRaw.recipeIngredient) throw ERRORS.MISSING_DATA // New line to check for missing ingredients

		let author,
			sourceUrl,
			cookTime,
			imageUrl,
			keywords,
			prepTime,
			ingredients,
			instructions,
			category,
			cuisine,
			rating,
			totalTime,
			description,
			servings,
			video,
			nutrition

		try {
			author = recipeRaw.author ? getAuthor(recipeRaw.author) : domain
		} catch (error) {
			console.error('Error in getAuthor:', error)
		}

		try {
			sourceUrl = url
		} catch (error) {
			console.error('Error in getUrl:', error)
		}

		try {
			description = parseInstructions(recipeRaw.description)
		} catch (error) {
			console.error('Error in getUrl:', error)
		}

		try {
			cookTime = recipeRaw.cookTime ? durationToText(recipeRaw.cookTime) : undefined
		} catch (error) {
			console.error('Error in durationToText for cookTime:', error)
		}

		try {
			imageUrl = getImage(recipeRaw.image)
		} catch (error) {
			console.error('Error in getImage:', error)
		}

		try {
			// If keywords is an array already, trim
			if (Array.isArray(recipeRaw.keywords)) {
				keywords = recipeRaw.keywords.map((v) => v.trim())
			} else if (typeof recipeRaw.keywords === 'string') {
				// Otherwise, if it's a string, convert to an array + trim
				keywords = recipeRaw.keywords.split(',').map((v) => v.trim())
			} else {
				keywords = []
			}
		} catch (error) {
			console.error('Error in keywords processing:', error)
		}

		try {
			prepTime = recipeRaw.prepTime ? durationToText(recipeRaw.prepTime) : undefined
		} catch (error) {
			console.error('Error in durationToText for prepTime:', error)
		}

		try {
			ingredients = parseIngredients(recipeRaw.recipeIngredient)
		} catch (error) {
			console.error('Error in ingredients:', error)
		}

		try {
			instructions = parseInstructions(recipeRaw.recipeInstructions)
		} catch (error) {
			console.error('Error in parseInstructions:', error)
		}

		try {
			category = Array.isArray(recipeRaw.recipeCategory)
				? recipeRaw.recipeCategory
				: recipeRaw.recipeCategory
				? [recipeRaw.recipeCategory]
				: undefined
		} catch (error) {
			console.error('Error in category:', error)
		}

		try {
			cuisine = Array.isArray(recipeRaw.recipeCuisine)
				? recipeRaw.recipeCuisine
				: recipeRaw.recipeCuisine
				? [recipeRaw.recipeCuisine]
				: undefined
		} catch (error) {
			console.error('Error in cuisine:', error)
		}

		try {
			rating = getRating(recipeRaw.aggregateRating)
		} catch (error) {
			console.error('Error in getRating:', error)
		}

		try {
			totalTime = recipeRaw.totalTime ? durationToText(recipeRaw.totalTime) : undefined
		} catch (error) {
			console.error('Error in durationToText for totalTime:', error)
		}

		try {
			servings = recipeRaw.recipeYield

			// Check if servings is an array
			if (Array.isArray(servings)) {
				servings = servings[0]
			}
		} catch (error) {
			console.error('Error in recipeYield:', error)
		}

		try {
			video = parseVideo(recipeRaw.video)
		} catch (error) {
			console.error('Error in parseVideo:', error)
		}

		try {
			nutrition = getNutrition(recipeRaw.nutrition)
		} catch (error) {
			console.error('Error in getNutrition:', error)
		}

		const recipe = {
			name: recipeRaw.name,
			author,
			datePublished: recipeRaw.datePublished ? new Date(recipeRaw.datePublished) : undefined,
			sourceUrl,
			cookTime,
			description,
			imageUrl,
			keywords,
			prepTime,
			ingredients,
			instructions,
			category,
			cuisine,
			rating,
			totalTime,
			servings,
			...video,
			nutrition
		}

		if (!recipe.name) {
			throw ERRORS.MISSING_DATA
		}
		return recipe
	} catch (error) {
		console.log('Error: ' + error)
		return typeof error === 'string' ? error : 'Unknown error'
	}
}

/**
 * Downloads the HTML content of a given URL.
 *
 * @param {string} url - The URL to fetch.
 * @returns {Promise<string>} A promise that resolves with the HTML content.
 */
async function downloadHTML(url) {
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
	return parsedHTML
}
