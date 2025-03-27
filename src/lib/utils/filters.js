import { parse } from '$lib/submodules/recipe-ingredient-parser/src/index.js'
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
export function ingredientProcess(ingredientArray, language) {
	const parsedIngredients = []
	language ? '' : (language = 'eng')

	ingredientArray.forEach((ingredientString) => {
		const ingredientStr = sanitizeIngredient(ingredientString)
		try {
			const ingredientObject = parse(ingredientStr, language)
			if (!ingredientObject) {
				throw new Error('Parsed ingredient is null')
			}

			parsedIngredients.push(ingredientObject)
		} catch (error) {
			// Log the error for debugging purposes
			console.error('Error occurred while processing ingredient:', error)
			// Add the fallback object
			parsedIngredients.push({
				quantity: 0,
				unit: null,
				unitPlural: null,
				symbol: null,
				ingredient: ingredientStr,
				minQty: 0,
				maxQty: 0
			})
		}
	})

	return parsedIngredients
}

/**
 * Sanitize a string for YAML front matter.
 * @param {string} str - The input string to sanitize.
 * @returns {string} The sanitized string.
 */
export function sanitizeIngredient(str) {
	if (!str) return ''

	const fractionMap = {
		'½': '1/2',
		'⅓': '1/3',
		'⅔': '2/3',
		'¼': '1/4',
		'¾': '3/4',
		'⅕': '1/5',
		'⅖': '2/5',
		'⅗': '3/5',
		'⅘': '4/5',
		'⅙': '1/6',
		'⅚': '5/6',
		'⅐': '1/7',
		'⅛': '1/8',
		'⅜': '3/8',
		'⅝': '5/8',
		'⅞': '7/8',
		'⅑': '1/9',
		'⅒': '1/10'
		// Add more fractions if needed
	}

	// Ensure there's a space before fractions not at the start
	str = str.replace(/(?<!^)(?=[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒])/g, ' ')

	for (let [fraction, ascii] of Object.entries(fractionMap)) {
		const regex = new RegExp(fraction, 'g')
		str = str.replace(regex, ascii)
	}

	str = str.replace(/"/g, '')
	str = str.replace(/\\/g, '\\\\')
	str = str.replace(/"/g, '\\"')
	// Replace any hyphens or dashes at the beginning
	str = str.replace(/^\s*[-–—]\s*/, '')

	// Trim any leading or trailing spaces
	return str.trim()
}

export function sanitizeFilename(filename) {
	return filename.replace(/[^\w\s-.]/gi, '_')
}

/**
 * Scales numbers within a string by a specified factor. This includes whole numbers, fractions, Unicode fractions,
 * decimal numbers, and combinations of whole numbers and fractions (with or without space).
 *
 * @param {string} str - The string with numbers to scale.
 * @param {number} scale - The factor to scale numbers by.
 * @returns {string} - The string with scaled numbers.
 */
export function scaleNumbersInString(str, scale) {
	// Check if scale is a valid number
	if (isNaN(scale) || scale < 0) {
		scale = 1
	}
	const fractionMap = {
		'½': '1/2',
		'⅓': '1/3',
		'⅔': '2/3',
		'¼': '1/4',
		'¾': '3/4',
		'⅕': '1/5',
		'⅖': '2/5',
		'⅗': '3/5',
		'⅘': '4/5',
		'⅙': '1/6',
		'⅚': '5/6',
		'⅐': '1/7',
		'⅛': '1/8',
		'⅜': '3/8',
		'⅝': '5/8',
		'⅞': '7/8',
		'⅑': '1/9',
		'⅒': '1/10'
	}

	// Insert space between a whole number and a following Unicode fraction
	Object.keys(fractionMap).forEach((fraction) => {
		const regex = new RegExp(`(\\d)(${fraction})`, 'g')
		str = str.replace(regex, `$1 $2`)
	})

	// Convert Unicode fractions to numeric fractions
	for (const [unicodeFraction, numericFraction] of Object.entries(fractionMap)) {
		const regex = new RegExp(unicodeFraction, 'g')
		str = str.replace(regex, numericFraction)
	}

	// Scale numbers, numeric fractions, and combinations of whole numbers and fractions
	return str.replace(/(\d+\s*\d*\/\d+|\d+(\.\d+)?)/g, (match) => {
		const decimal = convertToDecimal(match.trim()) // Convert to decimal, handling whole numbers and fractions
		const scaledNumber = decimal * scale
		// Format scaled number to ensure consistent decimal places
		return scaledNumber % 1 === 0
			? String(scaledNumber)
			: scaledNumber.toFixed(2).replace(/\.?0+$/, '')
	})
}

/**
 * Converts a fraction string or a whole number plus fraction string to a decimal.
 * @param {string} str - The string to convert, which can be a simple fraction or a whole number plus fraction.
 * @returns {number} The decimal equivalent of the input.
 */
function convertToDecimal(str) {
	const parts = str.split(' ')
	let decimal = 0

	parts.forEach((part) => {
		if (part.includes('/')) {
			const [numerator, denominator] = part.split('/').map(Number)
			decimal += numerator / denominator // Add the fraction's decimal value
		} else {
			decimal += parseFloat(part) // Add the whole number or decimal
		}
	})

	return decimal
}

/**
 * Converts a decimal number to its fraction representation, if possible.
 *
 * @param {number} decimal - The decimal number to convert.
 * @returns {string | number} - The fraction representation or original number.
 */
export function decimalToFraction(decimal, decimalPlaces = 10, tolerance = 1e-10) {
	// Return the rounded decimal if the number is higher than 10
	if (decimal > 10) return roundToDecimalPlaces(decimal, 0)

	const fractions = {
		0.1: '⅒',
		0.2: '⅕',
		0.25: '¼',
		0.3: '⅓',
		0.4: '⅖',
		0.5: '½',
		0.6: '⅗',
		0.66: '⅔',
		0.7: '⅔',
		0.75: '¾',
		0.8: '⅘',
		0.9: '⅚'
	}

	// Determine the whole number and fractional parts
	const wholeNumber = Math.floor(decimal)
	const fractionalPart = decimal - wholeNumber

	// If the decimal is a whole number, simply return it
	if (fractionalPart === 0) {
		return wholeNumber.toString()
	}

	// Round to a fixed number of decimal places
	const roundedDecimal = roundToDecimalPlaces(fractionalPart, decimalPlaces)

	// Further round if the number is close to an integer
	const finalFractional = roundToTolerance(roundedDecimal, tolerance)

	if (fractions[finalFractional]) {
		return wholeNumber === 0
			? fractions[finalFractional]
			: `${wholeNumber}${fractions[finalFractional]}`
	} else {
		let closestFraction
		let smallestDifference = Infinity

		for (let key in fractions) {
			let difference = Math.abs(finalFractional - parseFloat(key))
			if (difference < smallestDifference) {
				smallestDifference = difference
				closestFraction = fractions[key]
			}
		}

		return wholeNumber === 0 ? closestFraction : `${wholeNumber}${closestFraction}`
	}
}

/**
 * Rounds an ingredient quantity to the nearest whole number if greater than 10,
 * or to one decimal place if 10 or less.
 *
 * @param {number} decimal - The decimal quantity to round.
 * @returns {number} - The rounded quantity.
 */
export function roundIngredientQuantity(decimal) {
	if (decimal > 10) return roundToDecimalPlaces(decimal, 0)
	else return roundToDecimalPlaces(decimal, 1)
}

/**
 * Rounds a number to a specified number of decimal places.
 *
 * @function
 * @param {number} num - The number to be rounded.
 * @param {number} decimalPlaces - The number of decimal places to round to.
 * @returns {number} - The rounded number.
 * @example
 *
 * roundToDecimalPlaces(123.4567, 2); // returns 123.46
 */
function roundToDecimalPlaces(num, decimalPlaces) {
	const factor = Math.pow(10, decimalPlaces)
	return Math.round(num * factor) / factor
}

/**
 * Rounds a number to the nearest integer if it's within a specified tolerance.
 *
 * @function
 * @param {number} num - The number to be checked and potentially rounded.
 * @param {number} [tolerance=1e-10] - The tolerance within which the number will be rounded to the nearest integer.
 * @returns {number} - The original number or its rounded value if it's within the tolerance.
 * @example
 *
 * roundToTolerance(123.00000000001); // returns 123
 * roundToTolerance(123.0001, 0.001); // returns 123
 */
function roundToTolerance(num, tolerance = 1e-10) {
	const rounded = Math.round(num)
	if (Math.abs(num - rounded) < tolerance) {
		return rounded
	}
	return num
}

/**
 * Converts unicode characters in a string to their ASCII representation.
 *
 * @param {string} str - The string to convert.
 * @returns {string} - The string with unicode characters converted to ASCII.
 */
export function unicodeToAscii(str) {
	// eslint-disable-next-line no-misleading-character-class
	return str
		.normalize('NFKD')
		.replace(/[\u0300-\u036F]/g, '')
		.replace(/[\u0080-\u009F\u0100-\u07FF]/g, '\uFFFD') // Adjusted range
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
