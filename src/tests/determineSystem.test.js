import { determineSystem } from '$lib/utils/converter.js'

/* global describe, expect, it */

describe('determineSystem function', () => {
	it('should return metric system as dominant', () => {
		const ingredients = [
			{ unit: 'gram', unitSystem: 'metric' },
			{ unit: 'liter', unitSystem: 'metric' },
			{ unit: 'milliliter', unitSystem: 'metric' }
		]
		const result = determineSystem(ingredients)
		expect(result.system).toBe('metric')
	})

	it('should return metric system as dominant', () => {
		const ingredients = [
			{ unit: 'gram', unitSystem: 'metric' },
			{ unit: 'liter', unitSystem: 'metric' },
			{ unit: 'tablespoon', unitSystem: 'americanVolumetric' }
		]
		const result = determineSystem(ingredients)
		expect(result.system).toBe('metric')
	})

	it('should return imperial system as dominant', () => {
		const ingredients = [
			{ unit: 'fluid ounce', unitSystem: 'imperial' },
			{ unit: 'pound', unitSystem: 'imperial' },
			{ unit: 'gallon', unitSystem: 'imperial' }
		]
		const result = determineSystem(ingredients)
		expect(result.system).toBe('imperial')
	})

	it('should return imperial system as dominant', () => {
		const ingredients = [
			{ unit: 'ounce', unitSystem: 'imperial' },
			{ unit: 'pound', unitSystem: 'imperial' },
			{ unit: '', unitSystem: null }
		]
		const result = determineSystem(ingredients)
		expect(result.system).toBe('imperial')
		expect(result.counts).toEqual({
			metric: 0,
			imperial: 2,
			americanVolumetric: 0
		})
	})

	it('should return americanVolumetric system as dominant', () => {
		const ingredients = [
			{ unit: 'cup', unitSystem: 'americanVolumetric' },
			{ unit: 'quart', unitSystem: 'americanVolumetric' }
		]
		const result = determineSystem(ingredients)
		expect(result.system).toBe('americanVolumetric')
	})

	it('should return inconclusive if there is a tie', () => {
		const ingredients = [
			{ unit: 'gram', unitSystem: 'metric' },
			{ unit: 'cup', unitSystem: 'americanVolumetric' }
		]
		const result = determineSystem(ingredients)
		expect(result.system).toBe('inconclusive')
	})

	it('should return counts of each system', () => {
		const ingredients = [
			{ unit: 'gram', unitSystem: 'metric' },
			{ unit: 'cup', unitSystem: 'americanVolumetric' },
			{ unit: 'pound', unitSystem: 'imperial' }
		]
		const result = determineSystem(ingredients)
		expect(result.counts).toEqual({
			metric: 1,
			imperial: 1,
			americanVolumetric: 1
		})
	})
})
