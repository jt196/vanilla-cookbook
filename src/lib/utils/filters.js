import { parse } from 'recipe-ingredient-parser-v3'
import he from 'he'

/**
 * Filters data based on a search string and a key.
 *
 * @param {string | null} searchString - The search string.
 * @param {IGenericRecord[]} data - An array of data to search through.
 * @param {string} key - The key in the data objects to search against.
 * @returns {IGenericRecord[]} - The filtered array.
 */
export function filterSearch(searchString, data, key) {
	let myFilteredArray = data

	if (searchString) {
		myFilteredArray = myFilteredArray.filter((r) =>
			r[key]?.toString().toLowerCase().includes(searchString.toLowerCase())
		)
	}

	return myFilteredArray
}

/**
 * Processes an array of ingredient strings to return parsed ingredient objects.
 *
 * @param {string[]} ingredientArray - The ingredient strings to process.
 * @returns {parsedIngredient[]} - An array of parsed ingredient objects.
 */
export function ingredientProcess(ingredientArray) {
	const parsedIngredients = []

	ingredientArray.forEach((ingredientString) => {
		const ingredientStr = sanitizeForYamlFrontMatter(ingredientString)
		try {
			const ingredientObject = parse(ingredientStr, 'eng')

			if (!ingredientObject) {
				throw new Error('Parsed ingredient is null')
			}

			parsedIngredients.push(ingredientObject)
		} catch (error) {
			// Log the error for debugging purposes
			console.error('Error occurred while processing ingredient:', error)
		}
	})

	return parsedIngredients
}

/**
 * Sanitize a string for YAML front matter.
 * @param {string} str - The input string to sanitize.
 * @returns {string} The sanitized string.
 */
export function sanitizeForYamlFrontMatter(str) {
	if (!str) return ''

	str = str
		.split('')
		.filter((char) => {
			const charCode = char.charCodeAt(0)
			return charCode >= 32 && charCode <= 126 // Keep printable ASCII characters
		})
		.join('')

	str = str.replace(': ', ' - ')
	str = str.replace('*', '')
	str = str.replace('"', '')
	str = str.replace(/\\/g, '\\\\')
	str = str.replace(/"/g, '\\"')

	return str
}

/**
 * Scales numbers within a string by a specified factor.
 *
 * @param {string} str - The string with numbers to scale.
 * @param {number} scale - The factor to scale numbers by.
 * @returns {string} - The string with scaled numbers.
 */
export function scaleNumbersInString(str, scale) {
	return str.replace(/\d+(\.\d+)?/g, (match) => {
		const scaledNumber = parseFloat(match) * scale
		return scaledNumber.toString()
	})
}

/**
 * Converts a decimal number to its fraction representation, if possible.
 *
 * @param {number} decimal - The decimal number to convert.
 * @returns {string | number} - The fraction representation or original number.
 */
export function decimalToFraction(decimal) {
	const fractions = {
		0.1: '⅒',
		0.2: '⅕',
		0.25: '¼',
		0.3: '⅓',
		0.33: '⅓',
		0.4: '⅖',
		0.5: '½',
		0.6: '⅗',
		0.66: '⅔',
		0.7: '⅔',
		0.75: '¾',
		0.8: '⅘',
		0.9: '⅚',
		'1/3': '⅓',
		'2/3': '⅔'
	}

	return fractions[decimal.toString()] || decimal
}

/**
 * Converts unicode characters in a string to their ASCII representation.
 *
 * @param {string} str - The string to convert.
 * @returns {string} - The string with unicode characters converted to ASCII.
 */
export function unicodeToAscii(str) {
	// eslint-disable-next-line no-control-regex
	return str.replace(/[^\u0000-\u007F]/g, function (char) {
		// eslint-disable-next-line no-control-regex
		return char.normalize('NFKD').replace(/[^\u0000-\u007F]/g, '\uFFFD')
	})
}

/**
 * Decodes HTML entities in a string.
 *
 * @param {string} str - The string with HTML entities.
 * @returns {string} - The decoded string.
 */
export function decodeHTMLEntities(str) {
	return he.decode(str)
}

/**
 * Checks if a string starts with "http".
 *
 * @param {string} str - The string to check.
 * @returns {boolean} - True if the string starts with "http", otherwise false.
 */
export function startsWithHttp(str) {
	return str.startsWith('http')
}

/**
 * Processes a nutrition object and converts it to a readable string.
 *
 * @param {object} nutritionObject - The nutrition object to process.
 * @returns {string} - A string representation of the nutrition object.
 */
export function nutritionProcess(nutritionObject) {
	if (nutritionObject) {
		const nutritionArray = []

		for (const key in nutritionObject) {
			if (key !== '@type') {
				const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
					return str.toUpperCase()
				})

				nutritionArray.push(`${formattedKey}: ${nutritionObject[key]}`)
			}
		}

		return nutritionArray.join('\n')
	}
}
