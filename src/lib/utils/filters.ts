import type { IGenericRecord, IParsedIngredient } from '$lib/types'
import { parse } from 'recipe-ingredient-parser-v3'

// Annotate the searchString parameter with string | null type. This means searchString can be either a string or null.
// Annotate the data parameter with IRecord[], which is an array of IRecord objects.
// Annotate the key parameter with string type, since keys in JavaScript objects are strings.
// Annotate the function's return type with IRecord[].
export function filterSearch(
	searchString: string | null,
	data: IGenericRecord[],
	key: string
): IGenericRecord[] {
	// copy array
	let myFilteredArray = data
	// filter the array with favourites or search criteria
	if (searchString) {
		// Run filter on name of recipe
		myFilteredArray = myFilteredArray.filter((r) =>
			// Added a safety check r[key]?.toString() to make sure that if the key exists,
			// its value will be converted to a string before applying the toLowerCase() method.
			// This prevents potential runtime errors if the value is not a string.
			r[key]?.toString().toLowerCase().includes(searchString.toLowerCase())
		)
	}
	return myFilteredArray
}

export function ingredientProcess(ingredientArray: string[]): IParsedIngredient[] {
	const parsedIngredients: IParsedIngredient[] = []

	ingredientArray.forEach((ingredientString: string) => {
		const ingredientStr = sanitizeForYamlFrontMatter(ingredientString)
		try {
			const ingredientObject: IParsedIngredient | null = parse(ingredientStr, 'eng')

			if (!ingredientObject) {
				throw new Error('Parsed ingredient is null')
			}

			parsedIngredients.push(ingredientObject)
		} catch (error) {
			// If you need a fallback mechanism, this is where you'd put it.
			// For now, it'll just continue processing the next ingredient.
		}
	})

	return parsedIngredients
}

// Sanitise string for inclusion in YML frontmatter
export function sanitizeForYamlFrontMatter(str: string) {
	if (!str) return ''
	// Remove any invalid YAML characters
	/* eslint-disable no-control-regex */
	str = str.replaceAll(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, '')
	/* eslint-enable no-control-regex */
	// Remove any semicolons
	str = str.replaceAll(': ', ' - ')
	str = str.replaceAll('*', '')
	// This is so I can correctly produce an array with double quotes
	str = str.replaceAll('"', '')

	// Escape any special characters
	str = str.replaceAll(/\\/g, '\\\\')
	str = str.replaceAll(/"/g, '\\"')

	return str
}

// Take a string and scale the numbers inside it by a specified number
export function scaleNumbersInString(str: string, scale: number): string {
	return str.replace(/\d+(\.\d+)?/g, (match) => {
		const scaledNumber = parseFloat(match) * scale
		return scaledNumber.toString()
	})
}

// Convert decimal to fraction for displaying on the recipes.
export function decimalToFraction(decimal: number): string | number {
	const fractions: Record<string, string> = {
		'0.1': '⅒',
		'0.2': '⅕',
		'0.25': '¼',
		'0.3': '⅓',
		'0.33': '⅓',
		'0.4': '⅖',
		'0.5': '½',
		'0.6': '⅗',
		'0.66': '⅔',
		'0.7': '⅔',
		'0.75': '¾',
		'0.8': '⅘',
		'0.9': '⅚',
		'1/3': '⅓',
		'2/3': '⅔'
	}

	return fractions[decimal.toString()] || decimal
}
