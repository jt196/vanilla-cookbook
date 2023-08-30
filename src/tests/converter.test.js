import { converter } from '$lib/utils/converter.js'

/* global describe, expect, it */

describe('converter function', () => {
	it('should convert grams to ounces correctly', () => {
		const result = converter(100, 'gram', 'ounce')
		expect(result.quantity).toBeCloseTo(3.5274, 2) // Check up to 2 decimal places
		expect(result.unit).toBe('ounce')
	})

	it('should convert ounces to grams correctly', () => {
		const result = converter(1, 'ounce', 'gram')
		expect(result.quantity).toBeCloseTo(28.3495, 2) // Check up to 2 decimal places
		expect(result.unit).toBe('gram')
	})

	it('should convert grams to pounds correctly', () => {
		const result = converter(1000, 'gram', 'pound')
		expect(result.quantity).toBeCloseTo(2.20462, 2) // Check up to 2 decimal places
		expect(result.unit).toBe('pound')
	})

	it('should convert pounds to grams correctly', () => {
		const result = converter(1, 'pound', 'gram')
		expect(result.quantity).toBeCloseTo(453.592, 2) // Check up to 2 decimal places
		expect(result.unit).toBe('gram')
	})

	// Add more tests for other units
})
