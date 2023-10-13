import {
	sortByKeyGeneric,
	sortByDate,
	randomSortArray,
	sortRecipesByKey
} from '$lib/utils/sorting.js'

import {
	filterSearch,
	ingredientProcess,
	sanitizeIngredient,
	scaleNumbersInString,
	decimalToFraction,
	unicodeToAscii,
	decodeHTMLEntities,
	startsWithHttp,
	nutritionProcess
} from '$lib/utils/filters.js'

import {
	localDateAndTime,
	getIsoDateTimeString,
	stringToISOString,
	convertToMinutes,
	convertMinutesToTime
} from '$lib/utils/dateTime.js'

/* global describe, expect, it, beforeAll, afterAll */

describe('Sorting functions', () => {
	const sampleData = [
		{ name: 'John', date: '2023-01-01' },
		{ name: 'Alice', date: '2022-05-15' },
		{ name: 'Bob', date: '2021-11-11' }
	]

	it('should sort by key in ascending order', () => {
		const result = sortByKeyGeneric(sampleData, 'name', 'asc')
		expect(result[0].name).toBe('Alice')
		expect(result[1].name).toBe('Bob')
		expect(result[2].name).toBe('John')
	})

	it('should sort by key in descending order', () => {
		const result = sortByKeyGeneric(sampleData, 'name', 'desc')
		expect(result[0].name).toBe('John')
		expect(result[1].name).toBe('Bob')
		expect(result[2].name).toBe('Alice')
	})

	it('should sort by date in ascending order', () => {
		const result = sortByDate(sampleData, 'date', 'asc')
		expect(result[0].date).toBe('2021-11-11')
		expect(result[1].date).toBe('2022-05-15')
		expect(result[2].date).toBe('2023-01-01')
	})

	it('should sort by date in descending order', () => {
		const result = sortByDate(sampleData, 'date', 'desc')
		expect(result[0].date).toBe('2023-01-01')
		expect(result[1].date).toBe('2022-05-15')
		expect(result[2].date).toBe('2021-11-11')
	})

	it('should randomly sort the array', () => {
		const result = randomSortArray([...sampleData])
		expect(result.length).toBe(sampleData.length)
		// This test is tricky since the result is random. We can just check if the length is preserved.
	})
})

describe('Filter functions', () => {
	describe('filterSearch', () => {
		const data = [{ name: 'Apple' }, { name: 'Banana' }, { name: 'Cherry' }]

		it('should filter based on search string', () => {
			const result = filterSearch('ban', data, 'name')
			expect(result.length).toBe(1)
			expect(result[0].name).toBe('Banana')
		})

		it('should return all items if search string is null', () => {
			const result = filterSearch(null, data, 'name')
			expect(result.length).toBe(3)
		})
	})

	describe('ingredientProcess', () => {
		let originalConsoleError

		beforeAll(() => {
			originalConsoleError = console.error
			console.error = () => {}
		})

		afterAll(() => {
			console.error = originalConsoleError
		})

		it('should process ingredient strings', () => {
			const ingredients = ['1 cup sugar', '2 tbsp salt']
			const result = ingredientProcess(ingredients)
			expect(result.length).toBe(2)
		})
	})

	describe('sanitizeIngredient', () => {
		it('should sanitize ingredient string', () => {
			const str = '½ an apple'
			const result = sanitizeIngredient(str)
			expect(result).toBe('1/2 an apple')
		})
	})

	describe('startsWithHttp', () => {
		it('should return true if string starts with http', () => {
			const result = startsWithHttp('http://example.com')
			expect(result).toBe(true)
		})

		it('should return false if string does not start with http', () => {
			const result = startsWithHttp('ftp://example.com')
			expect(result).toBe(false)
		})
	})

	describe('nutritionProcess', () => {
		it('should process nutrition object', () => {
			const nutrition = {
				'@type': 'NutritionInformation',
				calories: '100 kcal',
				fatContent: '5g'
			}
			const result = nutritionProcess(nutrition)
			expect(result).toContain('Calories: 100 kcal')
			expect(result).toContain('Fat Content: 5g')
		})
	})
	describe('scaleNumbersInString', () => {
		it('should scale numbers in a string', () => {
			const result = scaleNumbersInString('The recipe needs 10 apples and 2.5 cups of water', 2)
			expect(result).toBe('The recipe needs 20 apples and 5 cups of water')
		})
	})

	describe('decimalToFraction', () => {
		it('should convert 0.5 to ½', () => {
			const result = decimalToFraction(0.5)
			expect(result).toBe('½')
		})
		it('should convert 0.3 to ⅓', () => {
			const result = decimalToFraction(0.3)
			expect(result).toBe('⅓')
		})
		it('should convert 1.3 to 1⅓', () => {
			const result = decimalToFraction(1.3)
			expect(result).toBe('1⅓')
		})
		it('should convert 0.123 to ⅒', () => {
			const result = decimalToFraction(0.123)
			expect(result).toBe('⅒')
		})
		it('should convert 0.77 to ¾', () => {
			const result = decimalToFraction(0.77)
			expect(result).toBe('¾')
		})
		it('should return the whole number if above 10', () => {
			const result = decimalToFraction(11.5)
			expect(result).toBe(12)
		})
		it('should return the same if a whole number', () => {
			const result = decimalToFraction(225)
			expect(result).toBe(225)
		})
		it('should convert 1.2 to 1⅕', () => {
			const result = decimalToFraction(1.2)
			expect(result).toBe('1⅕')
		})
	})

	describe('unicodeToAscii', () => {
		it('should convert unicode characters to ASCII', () => {
			const result = unicodeToAscii('café')
			expect(result).toBe('cafe')
		})
	})

	describe('decodeHTMLEntities', () => {
		it('should decode HTML entities', () => {
			const result = decodeHTMLEntities('&lt;p&gt;Hello World&lt;/p&gt;')
			expect(result).toBe('<p>Hello World</p>')
		})
	})
})

describe('Date and Time utility functions', () => {
	describe('localDateAndTime', () => {
		let originalDateToLocaleDateString
		let originalDateToLocaleTimeString

		beforeAll(() => {
			// Save the original functions to restore them later
			originalDateToLocaleDateString = Date.prototype.toLocaleDateString
			originalDateToLocaleTimeString = Date.prototype.toLocaleTimeString

			// Mock the functions
			Date.prototype.toLocaleDateString = function () {
				return '1/1/2023'
			}
			Date.prototype.toLocaleTimeString = function () {
				return '12:00:00 AM'
			}
		})

		afterAll(() => {
			// Restore the original functions
			Date.prototype.toLocaleDateString = originalDateToLocaleDateString
			Date.prototype.toLocaleTimeString = originalDateToLocaleTimeString
		})

		it('should return local date and time format for a date object', () => {
			const date = new Date('2023-01-01T12:00:00Z')
			const result = localDateAndTime(date)
			expect(result).toBe('1/1/2023 12:00:00 AM')
		})

		it('should return local date and time format for a date string', () => {
			const result = localDateAndTime('2023-01-01T12:00:00Z')
			expect(result).toBe('1/1/2023 12:00:00 AM')
		})

		it('should return an empty string for null input', () => {
			const result = localDateAndTime(null)
			expect(result).toBe('')
		})
	})

	describe('getIsoDateTimeString', () => {
		it('should return the current datetime in ISO 8601 format', () => {
			const result = getIsoDateTimeString()
			expect(new Date(result).toISOString()).toBe(result)
		})
	})

	describe('stringToISOString', () => {
		it('should convert a date string to ISO format', () => {
			const result = stringToISOString('2023-01-01T12:00:00Z')
			expect(result).toBe('2023-01-01T12:00:00.000Z')
		})
	})

	describe('convertToMinutes', () => {
		it('should convert text input into minutes', () => {
			const result = convertToMinutes('2hr 30m')
			expect(result).toBe(150)
		})

		it('should return null for invalid input', () => {
			const result = convertToMinutes('invalid input')
			expect(result).toBeNull()
		})
	})

	describe('convertMinutesToTime', () => {
		it('should convert minutes into a readable string', () => {
			const result = convertMinutesToTime(150)
			expect(result).toBe('2hr 30 minutes')
		})

		it('should return only minutes for durations less than an hour', () => {
			const result = convertMinutesToTime(45)
			expect(result).toBe('45 minutes')
		})
	})
})

describe('sortByDate', () => {
	const mockRecipes = [
		{ name: 'B', created: new Date('2022-01-01') },
		{ name: 'A', created: new Date('2023-01-01') }
	]

	it('should sort recipes in ascending order by date when currentSort is desc or undefined', () => {
		const result = sortRecipesByKey(mockRecipes, 'created', 'desc')
		expect(result.sortedRecipes[0].name).toBe('B')
		expect(result.newSort).toBe('asc')
	})

	it('should sort recipes in descending order by date when currentSort is asc', () => {
		const result = sortRecipesByKey(mockRecipes, 'created', 'asc')
		expect(result.sortedRecipes[0].name).toBe('A')
		expect(result.newSort).toBe('desc')
	})
})

describe('sortRecipesByKey', () => {
	const mockRecipes = [
		{ name: 'B', created: new Date('2022-01-01') },
		{ name: 'A', created: new Date('2023-01-01') }
	]

	it('should sort recipes in ascending order by title when currentSort is desc or undefined', () => {
		const result = sortRecipesByKey(mockRecipes, 'name', 'desc')
		expect(result.sortedRecipes[0].name).toBe('A')
		expect(result.newSort).toBe('asc')
	})

	it('should sort recipes in descending order by title when currentSort is asc', () => {
		const result = sortRecipesByKey(mockRecipes, 'name', 'asc')
		expect(result.sortedRecipes[0].name).toBe('B')
		expect(result.newSort).toBe('desc')
	})
})
