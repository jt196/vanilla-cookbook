import parseIsoDuration from 'parse-iso-duration'
import humanizeDuration from 'humanize-duration'
import he from 'he'

/**
 * Parse the provided JSON-LD string to extract the recipe data.
 * @param {string} jsonLD - The JSON-LD string containing potential recipe data.
 * @returns {Object|undefined} The parsed recipe data or undefined if not found.
 */
export function parseRecipeToJSON(jsonLD) {
	if (!jsonLD) return undefined

	const json = JSON.parse(jsonLD)

	if (Array.isArray(json)) {
		const recipe = json.find((v) => {
			if (typeof v['@type'] === 'string') {
				return v['@type'].toLowerCase() === 'recipe'
			} else if (Array.isArray(v['@type'])) {
				return v['@type'].includes('Recipe')
			}
			return false
		})
		return recipe
	} else {
		return json
	}
}

/**
 * Extract the author's name from the provided data.
 * @param {string|Object} author - The author data, which can be a string or an object.
 * @returns {string} The author's name.
 */
export function getAuthor(author) {
	if (typeof author === 'string') return author
	if (Array.isArray(author)) return author[0].name
	return author?.name
}

/**
 * Convert an ISO duration string to a human-readable format.
 * @param {string} duration - The ISO duration string.
 * @returns {string} The human-readable duration.
 */
export function durationToText(duration) {
	try {
		const durationObject = parseIsoDuration(duration)
		return humanizeDuration(durationObject)
	} catch (error) {
		return duration
	}
}

/**
 * Parse and clean the provided instructions data.
 * @param {string|Array} instructions - The instructions data.
 * @returns {Array} An array of cleaned instruction strings.
 */
export function parseInstructions(instructions) {
	if (!instructions) return []

	// If instructions is an array of objects
	if (Array.isArray(instructions) && instructions[0] && typeof instructions[0] === 'object') {
		return instructions.map((v) => cleanString(v.text || v.name || ''))
	}

	// If instructions is an array of strings
	if (Array.isArray(instructions) && typeof instructions[0] === 'string') {
		return instructions.map(cleanString)
	}

	// If instructions is a string
	if (typeof instructions === 'string') {
		// Return it as a single-item array
		return [cleanString(instructions)]
	}

	// Handle other types as needed
	return []
}

/**
 * Parse and clean the provided ingredients data.
 * @param {string|Array} ingredients - The ingredients data.
 * @returns {Array} An array of cleaned ingredient strings.
 */
export function parseIngredients(ingredients) {
	// If ingredients is already an array, clean each string and return
	if (Array.isArray(ingredients)) {
		return ingredients.map(cleanString)
	}

	// If ingredients is a string, split by comma and clean each resulting string
	if (typeof ingredients === 'string') {
		return ingredients.split(',').map(cleanString)
	}

	// If ingredients is neither an array nor a string, return an empty array
	return []
}
/**
 * Clean a provided string by trimming and removing unnecessary spaces.
 * @param {string} str - The string to clean.
 * @returns {string} The cleaned string.
 */
export function cleanString(str) {
	if (typeof str !== 'string') {
		return '' // or return some default value if desired
	}
	return str
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.join(' ')
		.trim()
		.replace(/\s+/g, ' ')
}

/**
 * Extract the main URL from the provided recipe data.
 * @param {Object} recipe - The recipe data.
 * @returns {string|undefined} The main URL or undefined if not found.
 */
export function getUrl(recipe) {
	if (typeof recipe.mainEntityOfPage === 'string') return recipe.mainEntityOfPage
	if (recipe.mainEntityOfPage?.['@id']?.includes('http')) return recipe.mainEntityOfPage['@id']
	return typeof recipe.isPartOf === 'string' ? recipe.isPartOf : recipe.isPartOf?.url
}

/**
 * Extract the main image URL from the provided image data.
 * @param {string|Object} image - The image data.
 * @returns {string|undefined} The image URL or undefined if not found.
 */
export function getImage(image) {
	if (!image) return undefined
	if (typeof image === 'string') return image
	if (Array.isArray(image)) return image[0].url
	return image.url
}

/**
 * Convert the provided rating data to a float.
 * @param {Object} rating - The rating data.
 * @returns {number|undefined} The rating as a float or undefined if not found.
 */
export function getRating(rating) {
	if (!rating) return undefined
	return parseFloat(rating.ratingValue)
}

/**
 * Parse the provided video data to extract relevant details.
 * @param {string|Object} video - The video data.
 * @returns {Object} An object containing video details.
 */
export function parseVideo(video) {
	if (!video) return {}
	if (typeof video === 'string') return { videoUrl: video }
	if (Array.isArray(video)) {
		return {
			videoUrl: video[0].url || video[0].embedUrl,
			videoThumbnail: video[0].thumbnailUrl,
			videoTitle: video[0].name
		}
	}
	return {
		videoThumbnail: video.thumbnailUrl,
		videoTitle: video.name,
		videoUrl: video.contentUrl || video.embedUrl
	}
}

/**
 * Return the provided nutrition data as-is.
 * @param {Object} nutrition - The nutrition data.
 * @returns {Object|undefined} The nutrition data or undefined if not provided.
 */
export function getNutrition(nutrition) {
	if (!nutrition) return undefined
	return nutrition
}

/**
 * Extract recipe data using CSS selectors from a parsed HTML root using a provided configuration.
 * @param {Object} root - The parsed HTML root.
 * @param {Object} config - The configuration object containing CSS selectors.
 * @returns {Object} An object containing extracted recipe data.
 */
export function parseUsingSiteConfig(root, config) {
	return {
		recipeYield: config.servingsSelector
			? root.querySelector(config.servingsSelector)?.text.trim()
			: null,
		prepTime: config.prepTimeSelector
			? root.querySelector(config.prepTimeSelector)?.text.trim()
			: null,
		cookTime: config.cookTimeSelector
			? root.querySelector(config.cookTimeSelector)?.text.trim()
			: null,
		totalTime: config.totalTimeSelector
			? root.querySelector(config.totalTimeSelector)?.text.trim()
			: null,
		recipeIngredient: config.ingredientsSelector
			? [...root.querySelectorAll(config.ingredientsSelector)].map((el) => el.text.trim())
			: [],
		recipeInstructions: config.instructionsSelector
			? [...root.querySelectorAll(config.instructionsSelector)].map((el) => el.text.trim())
			: [],
		recipeCategory: config.categorySelector
			? [...root.querySelectorAll(config.categorySelector)].map((el) => {
					return el.text.trim()
			  })
			: [],
		description: config.descriptionSelector
			? root.querySelector(config.descriptionSelector)?.text.trim()
			: null,
		notes: config.notesSelector ? root.querySelector(config.notesSelector)?.text.trim() : null,
		name: config.nameSelector ? root.querySelector(config.nameSelector)?.text.trim() : null
	}
}

/**
 * Extract the base domain from a given URL.
 * @param {string} url - The URL to extract the domain from.
 * @returns {string} The extracted domain.
 */
export function getDomainFromUrl(url) {
	const domain = new URL(url).hostname
	return domain.replace('www.', '') // Remove 'www.' if it exists
}

/**
 * Extract schema.org microdata from the provided parsed HTML root.
 * @param {Object} root - The parsed HTML root.
 * @returns {Object} An object containing extracted microdata.
 */
export function extractMicrodata(root) {
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

/**
 * Extract nested properties from a main element using a provided selector.
 * @param {Object} root - The main element.
 * @param {string} mainSelector - The CSS selector to use for extraction.
 * @returns {Object|null} An object containing extracted properties or null if not found.
 */
export function extractNestedProperties(root, mainSelector) {
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

/**
 * Extract text content from an element using provided selectors.
 * If the item is meta, extract the content instead
 * @param {Object} root - The main element.
 * @param {...string} selectors - The CSS selectors to use for extraction.
 * @returns {Array} An array containing extracted text content.
 */
export function extractTextFromSelector(root, ...selectors) {
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

/**
 * Extract ingredient text from an element when standard itemprop attributes are not used.
 * See the tastykitchen example
 * @param {Object} item - The main element.
 * @returns {Array} An array containing extracted ingredient text.
 */
export function extractIngredientText(item) {
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

/**
 * Clean a provided JSON string to make it more readable and standardized.
 * @param {string} jsonString - The JSON string to clean.
 * @returns {string} The cleaned JSON string.
 */
export function cleanJsonString(jsonString) {
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

/**
 * Parse and extract recipe data from a provided JSON-LD string within a parsed HTML root.
 * @param {Object} root - The parsed HTML root.
 * @returns {Object|null} The parsed recipe data or null if not found.
 */
export function parseJSONLD(root) {
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

		try {
			recipeRaw = parseRecipeToJSON(cleanedJson)
		} catch (e) {
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
	return recipeRaw
}
