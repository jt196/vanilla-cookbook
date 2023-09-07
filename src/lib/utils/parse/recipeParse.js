import { ERRORS } from './parseErrors'
import {
	durationToText,
	getAuthor,
	getImage,
	getRating,
	parseInstructions,
	parseIngredients,
	parseVideo,
	parseRecipeToJSON,
	getNutrition,
	cleanString
} from './parseHelpers'
import parse from 'node-html-parser'
import { siteConfigurations } from './siteConfigurations'
import he from 'he'

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
			yeld,
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
			description = recipeRaw.description
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
			yeld = recipeRaw.recipeYield
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
			yeld,
			...video,
			nutrition
		}

		if (!recipe.name) {
			throw ERRORS.MISSING_DATA
		}
		return recipe
	} catch (error) {
		console.log('🚀 ~ file: recipeParse.js:211 ~ parseRecipe ~ error:', error)
		return typeof error === 'string' ? error : 'Unknown error'
	}
}

async function downloadHTML(url) {
	const response = await fetch(url)
	return response.text()
}

export async function parseHTML(html, url) {
	const recipe = parseRecipe(html, url)
	return recipe
}

export async function parseURL(url) {
	const html = await downloadHTML(url)
	const parsedHTML = await parseHTML(html, url)
	return parsedHTML
}

// Helper function to extract data using CSS selectors with node-html-parser
function parseUsingSiteConfig(root, config) {
	return {
		recipeYield: root.querySelector(config.servingsSelector)?.text.trim(),
		prepTime: root.querySelector(config.prepTimeSelector)?.text.trim(),
		cookTime: root.querySelector(config.cookTimeSelector)?.text.trim(),
		totalTime: root.querySelector(config.totalTimeSelector)?.text.trim(),
		recipeIngredient: root.querySelectorAll(config.ingredientsSelector).map((el) => el.text.trim()),
		recipeInstructions: root
			.querySelectorAll(config.instructionsSelector)
			.map((el) => el.text.trim()),
		description: root.querySelector(config.descriptionSelector)?.text.trim(),
		name: root.querySelector(config.nameSelector)?.text.trim()
	}
}

// Grab base domain from the URL
function getDomainFromUrl(url) {
	const domain = new URL(url).hostname
	return domain.replace('www.', '') // Remove 'www.' if it exists
}

// Extract schema.org microdata from the recipe page
function extractMicrodata(root) {
	let isRecipeSchemaFound = true
	let item = root.querySelector(
		'[itemscope][itemtype="http://schema.org/Recipe"], [itemscope][itemtype="https://schema.org/Recipe"]'
	)

	// If no specific recipe itemtype is found, use the entire root as the item
	if (!item) {
		item = root
		isRecipeSchemaFound = false
	}

	// Now, when extracting the name, you can adjust based on the isRecipeSchemaFound variable:
	let name
	if (isRecipeSchemaFound) {
		name = extractTextFromSelector(item, '[itemprop="name"]')[0]
	} else {
		name = root.querySelector('title').text
	}
	let recipeIngredient = []
	try {
		recipeIngredient = extractTextFromSelector(item, '[itemprop="recipeIngredient"]')

		// If no ingredients found using "recipeIngredient", try "ingredients" as a fallback
		if (!recipeIngredient.length) {
			recipeIngredient = extractTextFromSelector(item, '[itemprop="ingredients"]')
		}

		if (Array.isArray(recipeIngredient) && typeof recipeIngredient[0] === 'string') {
			recipeIngredient = recipeIngredient.map(cleanString)
		}

		// If still no ingredients found, try the custom extraction method
		if (!recipeIngredient.length) {
			recipeIngredient = extractIngredientText(item)
		}
	} catch (error) {
		console.error('Error extracting ingredients:', error)
	}
	// const imageUrl = extractTextFromSelector(item, '[itemprop="image"]')[0]
	const image = extractTextFromSelector(item, '[itemprop*="image"]')[0]
	const sourceUrl = extractTextFromSelector(item, '[itemprop="url"]')[0]
	let description = extractTextFromSelector(item, '[itemprop="description"]')[0]
	if (Array.isArray(description) && typeof description[0] === 'string') {
		description = description.map(cleanString)
	} else {
		description = cleanString(description)
	}
	console.log('Extracted Ingredients:', recipeIngredient) // This will print the extracted ingredients

	const recipeInstructions = extractTextFromSelector(
		item,
		'[itemprop="recipeInstructions"]',
		'[itemprop="instructions"]'
	)
	const prepTime = extractTextFromSelector(item, '[itemprop="prepTime"]')[0]
	const totalTime = extractTextFromSelector(item, '[itemprop="totalTime"]')[0]
	const keywords = extractTextFromSelector(item, '[itemprop="keywords"]')[0]
	const recipeCategory = extractTextFromSelector(item, '[itemprop="recipeCategory"]')[0]
	const recipeCuisine = extractTextFromSelector(item, '[itemprop="recipeCuisine"]')[0]
	let recipeYield = extractTextFromSelector(item, '[itemprop="recipeYield"]')[0]
	recipeYield = cleanString(recipeYield)
	const datePublished = extractTextFromSelector(item, '[itemprop="datePublished"]')[0]
	const aggregateRating = extractNestedProperties(item, '[itemprop="aggregateRating"]')
	const nutrition = extractNestedProperties(item, '[itemprop="nutrition"]')
	const video = extractTextFromSelector(item, '[itemprop="video"]')[0]

	return {
		name,
		recipeIngredient,
		description,
		image,
		sourceUrl,
		recipeInstructions,
		prepTime,
		totalTime,
		keywords,
		recipeCategory,
		recipeCuisine,
		recipeYield,
		datePublished,
		aggregateRating,
		video,
		nutrition
	}
}

function extractNestedProperties(root, mainSelector) {
	const mainElement = root.querySelector(mainSelector)
	if (!mainElement) return null

	const properties = {}
	const nestedElements = mainElement.querySelectorAll('[itemprop]')

	nestedElements.forEach((el) => {
		const propName = el.getAttribute('itemprop')
		if (el.getAttribute('content')) {
			properties[propName] = el.getAttribute('content')
		} else if (el.text) {
			properties[propName] = el.text.trim()
		}
	})

	return properties
}

// Return text from a selector
// If the item is meta, extract the content instead
function extractTextFromSelector(root, ...selectors) {
	for (let selector of selectors) {
		// console.log('Trying selector:', selector) // Debugging line
		const elements = root.querySelectorAll(selector)
		if (elements && elements.length) {
			// console.log('Found elements for selector:', selector) // Debugging line
			if (selector.includes('instructions')) {
				// Handle instructions differently
				return [...elements].flatMap((el) => {
					// console.log('Processing element:', el) // Debugging line
					// console.log('Element type:', typeof el) // Debugging line
					// console.log('Element is instance of HTMLElement:', el instanceof HTMLElement) // Debugging line

					if (el && el.childNodes) {
						return [...el.childNodes]
							.filter((child) => child.nodeType === 1) // Node.ELEMENT_NODE
							.map((child) => child.text || child.textContent || '')
							.filter(Boolean)
					}
					return []
				})
			} else {
				const results = [...elements]
					.map((el) => {
						if (el.getAttribute('content')) {
							return el.getAttribute('content')
						} else if (el.getAttribute('data-src')) {
							return el.getAttribute('data-src')
						} else if (el.text) {
							return el.text
						} else if (el.tagName.toLowerCase() === 'meta') {
							return el.getAttribute('content')
						}
						return null
					})
					.filter(Boolean) // This will remove any null or empty values from the result

				if (results.length) {
					// console.log('Results for selector:', selector, results) // Debugging line
					return results
				}
			}
		}
	}
	// console.log('No results found for any selector') // Debugging line
	return []
}

// Extract ingredients with no itemprop="ingredients" and itemprops "name" and "amounts"
// See the tastykitchen example
function extractIngredientText(item) {
	const ingredients = []
	const ingredientElements = item.querySelectorAll('[itemprop="ingredient"]')

	for (const ingredientElement of ingredientElements) {
		const amount = ingredientElement.querySelector('[itemprop="amount"]')
		const name = ingredientElement.querySelector('[itemprop="name"]')

		if (amount && name) {
			ingredients.push(`${amount.textContent.trim()} ${name.textContent.trim()}`)
		} else if (name) {
			ingredients.push(name.textContent.trim())
		}
	}

	return ingredients
}

function cleanJsonString(jsonString) {
	// Decode HTML entities
	let cleanedString = he.decode(jsonString)

	// Remove tab characters
	cleanedString = cleanedString.replace(/\t/g, '')

	// Remove unnecessary spaces around special characters
	cleanedString = cleanedString.replace(/ & /g, '&')

	// Additional cleaning for known problematic entities
	cleanedString = cleanedString.replace(/&#039;/g, "'")

	// Replace line breaks inside JSON key or value
	cleanedString = cleanedString.replace(/"([^"]+)"/g, function (match) {
		return match.replace(/\n/g, ' ')
	})

	return cleanedString.trim()
}

function parseJSONLD(root) {
	let recipeRaw = null

	// This will get all JSON-LD scripts - double and single quote variations
	const jsonLDs = root.querySelectorAll(
		'script[type="application/ld+json"], script[type=\'application/ld+json\']'
	)

	const findRecipeInGraph = (graph) => {
		// console.log('Searching in graph:', JSON.stringify(graph, null, 2))
		console.log('Searching in graph')
		for (let item of graph) {
			// console.log('Checking item:', JSON.stringify(item, null, 2))
			console.log('Checking item')
			if (
				Array.isArray(item['@type']) &&
				item['@type'].includes('Recipe') &&
				item.recipeIngredient
			) {
				// console.log('Found recipe in array @type:', JSON.stringify(item, null, 2))
				console.log('Found recipe in array @type')
				return item
			}
			if (
				typeof item['@type'] === 'string' &&
				item['@type'] === 'Recipe' &&
				item.recipeIngredient
			) {
				// console.log('Found recipe in string @type:', JSON.stringify(item, null, 2))
				console.log('Found recipe in string @type')
				return item
			}
			if (item['@graph']) {
				const nestedResult = findRecipeInGraph(item['@graph'])
				if (nestedResult) return nestedResult
			}
		}
		console.log('No item found!')
		return null
	}

	for (let jsonLD of jsonLDs) {
		// Clean the JSON string
		const cleanedJson = cleanJsonString(jsonLD.textContent || jsonLD.innerText)
		console.log('Original JSON:', jsonLD.textContent || jsonLD.innerText)

		try {
			recipeRaw = parseRecipeToJSON(cleanedJson)
			console.log('🚀 ~ file: recipeParse.js:428 ~ parseJSONLD ~ recipeRaw:', recipeRaw)
		} catch (e) {
			console.log('🚀 ~ file: recipeParse.js:424 ~ parseJSONLD ~ cleanedJson:', cleanedJson)
			console.error('Error parsing JSON-LD:', e)
			continue // Move to the next script tag if this one fails
		}

		// Check if the parsed JSON is a recipe
		if (recipeRaw && recipeRaw['@type']) {
			const type = recipeRaw['@type']
			const isRecipe =
				(typeof type === 'string' && type.toLowerCase() === 'recipe') ||
				(Array.isArray(type) && type.map((t) => t.toLowerCase()).includes('recipe'))

			if (isRecipe && recipeRaw.name) {
				break // If a valid recipe with a name is found, break out of the loop
			}
		}

		// New code to handle nested @graph structure
		if (recipeRaw && recipeRaw['@graph']) {
			recipeRaw = findRecipeInGraph(recipeRaw['@graph'])
			if (recipeRaw) break
		}
	}

	console.log('🚀 ~ file: recipeParse.js:420 ~ parseJSONLD ~ recipeRaw:', recipeRaw)
	return recipeRaw
}
