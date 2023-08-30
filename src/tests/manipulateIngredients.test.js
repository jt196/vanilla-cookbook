import { manipulateIngredient } from '$lib/utils/converter.js'

/* global describe, expect, it */

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

	it('converts cups to grams', () => {
		const input = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'chilled water'
		}
		const result = manipulateIngredient(input, 'americanVolumetric', 'metric')
		const expected = {
			quantity: 227, // Replace with your expected output
			unit: 'gram',
			ingredient: 'chilled water'
		}
		// expect(result).toEqual(expected)
		expect(result).toEqual(expect.objectContaining(expected))
	})

	// Add more test cases as needed
})
