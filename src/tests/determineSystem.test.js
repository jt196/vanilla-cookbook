import { determineSystem } from '$lib/utils/converter.js'

/* global describe, expect, it */

describe('determineSystem function', () => {
	it('should return metric system as dominant', () => {
		const ingredients = [{ unit: 'gram' }, { unit: 'liter' }, { unit: 'milliliter' }]
		const result = determineSystem(ingredients)
		expect(result.system).toBe('metric')
	})

	it('should return metric system as dominant', () => {
		const ingredients = [{ unit: 'gram' }, { unit: 'liter' }, { unit: 'tablespoon' }]
		const result = determineSystem(ingredients)
		expect(result.system).toBe('metric')
	})

	it('should return imperial system as dominant', () => {
		const ingredients = [{ unit: 'fluid ounce' }, { unit: 'pound' }, { unit: 'gallon' }]
		const result = determineSystem(ingredients)
		expect(result.system).toBe('imperial')
	})

	it('should return imperial system as dominant', () => {
		const ingredients = [{ unit: 'ounce' }, { unit: 'pound' }, { unit: '' }]
		const result = determineSystem(ingredients)
		expect(result.system).toBe('imperial')
		expect(result.counts).toEqual({
			metric: 0,
			imperial: 2,
			americanVolumetric: 0
		})
	})

	it('should return americanVolumetric system as dominant', () => {
		const ingredients = [{ unit: 'cup' }, { unit: 'quart' }]
		const result = determineSystem(ingredients)
		expect(result.system).toBe('americanVolumetric')
	})

	it('should return inconclusive if there is a tie', () => {
		const ingredients = [{ unit: 'gram' }, { unit: 'cup' }]
		const result = determineSystem(ingredients)
		expect(result.system).toBe('inconclusive')
	})

	it('should return counts of each system', () => {
		const ingredients = [{ unit: 'gram' }, { unit: 'cup' }, { unit: 'pound' }]
		const result = determineSystem(ingredients)
		expect(result.counts).toEqual({
			metric: 1,
			imperial: 1,
			americanVolumetric: 1
		})
	})
})
