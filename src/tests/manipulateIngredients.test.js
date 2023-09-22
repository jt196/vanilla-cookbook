import { manipulateIngredient } from '$lib/utils/converter.js'
import { findSuitableUnit } from '$lib/utils/units.js'

/* global describe, expect, it */

// TODO: #93 Write more manipulateIngredient tests
describe('manipulateIngredient', () => {
	it('converts grams to cups', () => {
		const input = {
			quantity: 567,
			unit: 'gram',
			ingredient: 'unbleached bread flour'
		}
		const result = manipulateIngredient(input, 'metric', 'americanVolumetric')
		const expected = {
			quantity: 4.72, // Replace with your expected output
			unit: 'cup',
			ingredient: 'unbleached bread flour'
		}
		// expect(result).toEqual(expected)
		expect(result).toEqual(expect.objectContaining(expected))
	})

	it('converts grams to cups', () => {
		const input = {
			quantity: 198,
			unit: 'gram',
			ingredient: 'Rice (dry)'
		}
		const result = manipulateIngredient(input, 'metric', 'americanVolumetric')
		const expected = {
			quantity: 1, // Replace with your expected output
			unit: 'cup',
			ingredient: 'Rice (dry)'
		}
		// expect(result).toEqual(expected)
		expect(result).toEqual(expect.objectContaining(expected))
	})

	it('converts grams to cups', () => {
		const input = {
			quantity: 170,
			unit: 'gram',
			ingredient: 'Chocolate Chips'
		}
		const result = manipulateIngredient(input, 'metric', 'americanVolumetric')
		const expected = {
			quantity: 1, // Replace with your expected output
			unit: 'cup',
			ingredient: 'Chocolate Chips'
		}
		// expect(result).toEqual(expected)
		expect(result).toEqual(expect.objectContaining(expected))
	})

	it('converts grams to cups', () => {
		const input = {
			quantity: 170,
			unit: 'gram',
			ingredient: 'Chocolate Chunks'
		}
		const result = manipulateIngredient(input, 'metric', 'americanVolumetric')
		const expected = {
			quantity: 1, // Replace with your expected output
			unit: 'cup',
			ingredient: 'Chocolate Chunks'
		}
		// expect(result).toEqual(expected)
		expect(result).toEqual(expect.objectContaining(expected))
	})

	it('converts grams to ounces', () => {
		const input = {
			quantity: 11,
			unit: 'gram',
			ingredient: 'salt'
		}
		const result = manipulateIngredient(input, 'metric', 'imperial')
		const expected = {
			quantity: 0.4,
			unit: 'ounce',
			ingredient: 'salt',
			maxQty: 0.4,
			minQty: 0.4,
			symbol: 'o',
			unitPlural: 'ounces'
		}
		expect(result).toEqual(expected)
	})

	it('converts grams to tablespoons', () => {
		const input = {
			quantity: 4,
			unit: 'gram',
			ingredient: 'instant yeast'
		}
		const result = manipulateIngredient(input, 'metric', 'americanVolumetric')
		const expected = {
			quantity: 1.3,
			unit: 'teaspoon',
			ingredient: 'instant yeast'
		}
		expect(result).toEqual(expect.objectContaining(expected))
	})

	it('converts cups to grams', () => {
		const input = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'chilled water'
		}
		const result = manipulateIngredient(input, 'americanVolumetric', 'metric')
		const expected = {
			quantity: 236.6, // Replace with your expected output
			unit: 'gram',
			ingredient: 'chilled water'
		}
		// expect(result).toEqual(expected)
		expect(result).toEqual(expect.objectContaining(expected))
	})

	it('converts kg to cups', () => {
		const input = {
			quantity: 1.25,
			unit: 'kg',
			ingredient: 'unrefined golden granulated sugar'
		}
		const result = manipulateIngredient(input, 'metric', 'americanVolumetric')
		const expected = {
			quantity: 3.68, // Replace with your expected output
			unit: 'cup',
			ingredient: 'unrefined golden granulated sugar'
		}
		// expect(result).toEqual(expected)
		expect(result).toEqual(expect.objectContaining(expected))
	})

	it('converts cups to grams', () => {
		const input = {
			quantity: 0.75,
			unit: 'cups',
			ingredient: 'water'
		}
		const result = manipulateIngredient(input, 'americanVolumetric', 'metric')
		const expected = {
			quantity: 177.4, // Replace with your expected output
			unit: 'gram',
			ingredient: 'water'
		}
		// expect(result).toEqual(expected)
		expect(result).toEqual(expect.objectContaining(expected))
	})
	it('converts grams to cups', () => {
		const input = {
			quantity: 177.4, // Replace with your expected output
			unit: 'gram',
			ingredient: 'water'
		}
		const result = manipulateIngredient(input, 'metric', 'americanVolumetric')
		const expected = {
			quantity: 0.75,
			unit: 'cup',
			ingredient: 'water'
		}
		// expect(result).toEqual(expected)
		expect(result).toEqual(expect.objectContaining(expected))
	})
	it('converts teaspoons to grams', () => {
		const input = {
			quantity: 1, // Replace with your expected output
			unit: 'teaspoons',
			ingredient: 'salt'
		}
		const result = manipulateIngredient(input, 'americanVolumetric', 'metric')
		const expected = {
			quantity: 6,
			unit: 'gram',
			ingredient: 'salt'
		}
		// expect(result).toEqual(expected)
		expect(result).toEqual(expect.objectContaining(expected))
	})
})

describe('findSuitableUnit function', () => {
	it('should return "ounce" for imperial system and less than 16 ounces', () => {
		const result = findSuitableUnit('imperial', 400) // 400 grams is approximately 14.11 ounces
		expect(result).toBe('ounce')
	})

	it('should return "pound" for imperial system and 16 or more ounces', () => {
		const result = findSuitableUnit('imperial', 500) // 500 grams is approximately 17.64 ounces
		expect(result).toBe('pound')
	})

	it('should return "gram" for metric system and less than 1000 grams', () => {
		const result = findSuitableUnit('metric', 900)
		expect(result).toBe('gram')
	})

	it('should return "kilogram" for metric system and 1000 or more grams', () => {
		const result = findSuitableUnit('metric', 1000)
		expect(result).toBe('kilogram')
	})

	it('should return "teaspoon" for americanVolumetric system and less than 1/16 cups', () => {
		const result = findSuitableUnit('americanVolumetric', 10) // 10 grams is approximately 0.0423 cups
		expect(result).toBe('teaspoon')
	})

	it('should return "tablespoon" for americanVolumetric system and between 1/16 and 1/8 cups', () => {
		const result = findSuitableUnit('americanVolumetric', 20) // 20 grams is approximately 0.0845 cups
		expect(result).toBe('tablespoon')
	})

	it('should return "cup" for americanVolumetric system and 1/8 or more cups', () => {
		const result = findSuitableUnit('americanVolumetric', 30) // 30 grams is approximately 0.1268 cups
		expect(result).toBe('cup')
	})

	it('should return "gram" as default when system is not recognized', () => {
		const result = findSuitableUnit('unknownSystem', 500)
		expect(result).toBe('gram')
	})
})
