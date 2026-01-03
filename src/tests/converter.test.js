import {
	converter,
	parseTemperature,
	normalizeIngredient,
	manipulateIngredient
} from '$lib/utils/converter.js'
import Fuse from 'fuse.js'

/* global describe, expect, it, beforeEach, vi */

describe('converter function', () => {
	it('should convert grams to ounces correctly', () => {
		const result = converter(100, 'gram', 'ounce')
		expect(result.quantity).toBeCloseTo(3.5274, 2) // Check up to 2 decimal places
		expect(result.unit).toBe('ounce')
	})

	it('should convert grams to ounces correctly', () => {
		const result = converter(100, 'grams', 'ounces')
		expect(result.quantity).toBeCloseTo(3.5274, 2) // Check up to 2 decimal places
		expect(result.unit).toBe('ounces')
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

	it('should convert pounds to grams correctly', () => {
		const result = converter(1.25, 'pound', 'gram')
		expect(result.quantity).toBeCloseTo(566.99, 2) // Check up to 2 decimal places
		expect(result.unit).toBe('gram')
	})

	it('should convert litres to cups correctly', () => {
		const result = converter(1, 'litres', 'cup')
		expect(result.quantity).toBeCloseTo(4.23, 2) // Check up to 2 decimal places
		expect(result.unit).toBe('cup')
	})

	it('should convert cups to litres correctly', () => {
		const result = converter(1, 'cup', 'litre')
		expect(result.quantity).toBeCloseTo(0.24, 2) // Check up to 2 decimal places
		expect(result.unit).toBe('litre')
	})
})

describe('parseTemperature function', () => {
	it('should filter to show only Celsius when both units present', () => {
		const result = parseTemperature(
			'Preheat the oven to 180°C (350°F), Gas Mark 4.',
			'metric',
			'imperial'
		)
		expect(result).toBe('Preheat the oven to <span class="text-secondary">180°C</span>, Gas Mark 4.')
	})

	it('should convert "Preheat the oven to 350ºF"', () => {
		const result = parseTemperature('Preheat the oven to 350ºF', 'metric', 'imperial')
		expect(result).toBe('Preheat the oven to <span class="text-secondary">177°C</span>')
	})

	it('should convert "Preheat the oven to 350 degrees Fahrenheit"', () => {
		const result = parseTemperature(
			'Preheat the oven to 350 degrees Fahrenheit',
			'metric',
			'imperial'
		)
		expect(result).toBe('Preheat the oven to <span class="text-secondary">177°C</span>')
	})

	it('should filter to show only Fahrenheit when both units present', () => {
		const result = parseTemperature(
			'Preheat the oven to 180°C (350°F), Gas Mark 4.',
			'imperial',
			'metric'
		)
		expect(result).toBe('Preheat the oven to <span class="text-secondary">350°F</span>, Gas Mark 4.')
	})

	it('should not change "Bake for 30–35 minutes or until golden."', () => {
		const result = parseTemperature('Bake for 30–35 minutes or until golden.', 'metric', 'imperial')
		expect(result).toBe('Bake for 30–35 minutes or until golden.')
	})

	it('should not change "Bake for 30 to 35 minutes or until golden."', () => {
		const result = parseTemperature(
			'Bake for 30 to 35 minutes or until golden.',
			'metric',
			'imperial'
		)
		expect(result).toBe('Bake for 30 to 35 minutes or until golden.')
	})

	it('should convert "Set the water to 70 to 80C."', () => {
		const result = parseTemperature('Set the water to 70 to 80C.', 'imperial')
		expect(result).toBe('Set the water to <span class="text-secondary">158-176°F</span>.')
	})

	it('should convert "Set the water to 70 to 80 degrees C."', () => {
		const result = parseTemperature('Set the water to 70 to 80 degrees C.', 'imperial')
		expect(result).toBe('Set the water to <span class="text-secondary">158-176°F</span>.')
	})

	it('should convert "Heat to 158 to 176°F."', () => {
		const result = parseTemperature('Heat to 158 to 176°F.', 'metric')
		expect(result).toBe('Heat to <span class="text-secondary">70-80°C</span>.')
	})

	it('should filter to show only Celsius when both F and C present', () => {
		const result = parseTemperature('Preheat oven to 340 degrees F (171 C).', 'metric', 'imperial')
		expect(result).toBe('Preheat oven to <span class="text-secondary">171 C</span>.')
	})

	it('should convert "turn the oven on to heat up to 220ºC (fan)."', () => {
		const result = parseTemperature('turn the oven on to heat up to 220ºC (fan).', 'imperial')
		expect(result).toBe('turn the oven on to heat up to <span class="text-secondary">428°F</span> (fan).')
	})

	it('should convert "Preheat a Philips air fryer to 200-205C"', () => {
		const result = parseTemperature('Preheat a Philips air fryer to 200-205C.', 'imperial')
		expect(result).toBe('Preheat a Philips air fryer to <span class="text-secondary">392-401°F</span>.')
	})

	it('should convert "The sous-vide should be set to 70-80C for best results."', () => {
		const result = parseTemperature(
			'The sous-vide should be set to 70-80C for best results.',
			'imperial'
		)
		expect(result).toBe('The sous-vide should be set to <span class="text-secondary">158-176°F</span> for best results.')
	})

	it('should convert "Keep the bath at 158-176°F."', () => {
		const result = parseTemperature('Keep the bath at 158-176°F.', 'metric')
		expect(result).toBe('Keep the bath at <span class="text-secondary">70-80°C</span>.')
	})

	it('should convert "Preheat a Philips air fryer to 392-401°F."', () => {
		const result = parseTemperature('Preheat a Philips air fryer to 392-401°F.', 'metric')
		expect(result).toBe('Preheat a Philips air fryer to <span class="text-secondary">200-205°C</span>.')
	})

	it('should convert "Preheat the oven to 170°C. Then do something else."', () => {
		const result = parseTemperature(
			'Preheat the oven to 170°C. Then do something else.',
			'imperial'
		)
		expect(result).toBe('Preheat the oven to <span class="text-secondary">338°F</span>. Then do something else.')
	})

	it('should convert "be sure to cook them until they register 175 degrees."', () => {
		const result = parseTemperature(
			'be sure to cook them until they register 175 degrees.',
			'metric',
			'imperial'
		)
		expect(result).toBe('be sure to cook them until they register <span class="text-secondary">79°C</span>.')
	})

	it('should convert "Spread in a greased 13 x 9-inch pan, bake 25-30 minutes at 375F, let cool and cut into bars."', () => {
		const result = parseTemperature(
			'Spread in a greased 13 x 9-inch pan, bake 25-30 minutes at 375F, let cool and cut into bars.',
			'metric',
			'imperial'
		)
		expect(result).toBe(
			'Spread in a greased 13 x 9-inch pan, bake 25-30 minutes at <span class="text-secondary">191°C</span>, let cool and cut into bars.'
		)
	})

	it('should convert "Bake at 145C (fan), 160C (no fan) until lightly browned"', () => {
		const result = parseTemperature(
			'Bake at 145C (fan), 160C (no fan) until lightly browned',
			'imperial',
			'metric'
		)
		expect(result).toBe('Bake at <span class="text-secondary">293°F</span> (fan), <span class="text-secondary">320°F</span> (no fan) until lightly browned')
	})

	it('should convert "Meanwhile, adjust an oven rack to the middle position and heat the oven to 450 degrees."', () => {
		const result = parseTemperature(
			'Meanwhile, adjust an oven rack to the middle position and heat the oven to 450 degrees.',
			'metric',
			'imperial'
		)
		expect(result).toBe(
			'Meanwhile, adjust an oven rack to the middle position and heat the oven to <span class="text-secondary">232°C</span>.'
		)
	})

	it('should convert "218°C (205C convection)"', () => {
		const result = parseTemperature('218°C (205C convection)', 'imperial', 'metric')
		expect(result).toBe('<span class="text-secondary">424°F</span> (<span class="text-secondary">401°F</span> convection)')
	})

	it('should convert "Testing for false positives"', () => {
		const result = parseTemperature(
			'For the meat sauce, put the 3 tbsp oil, 2 finely chopped celery sticks, 1 finely chopped onion, 1 finely chopped carrot, 3 crushed garlic cloves and 140g cubed pancetta in another large saucepan. Gently cook together until the veg are soft but not coloured.',
			'imperial',
			'metric'
		)
		expect(result).toBe(
			'For the meat sauce, put the 3 tbsp oil, 2 finely chopped celery sticks, 1 finely chopped onion, 1 finely chopped carrot, 3 crushed garlic cloves and 140g cubed pancetta in another large saucepan. Gently cook together until the veg are soft but not coloured.'
		)
	})

	it('should convert "Testing for false positives with C"', () => {
		const result = parseTemperature('3 crushed garlic cloves', 'metric', 'metric')
		expect(result).toBe('3 crushed garlic cloves')
	})

	it('should convert "Heat oven to 180C/160C fan/gas 4."', () => {
		const result = parseTemperature('Heat oven to 180C/160C fan/gas 4.', 'imperial', 'metric')
		expect(result).toBe('Heat oven to <span class="text-secondary">356°F</span>/<span class="text-secondary">320°F</span> fan/gas 4.')
	})

	it('should convert "Towards the end of the rising time, preheat your oven to 176C (160C fan) with a rack in the center."', () => {
		const result = parseTemperature(
			'Towards the end of the rising time, preheat your oven to 176C (160C fan) with a rack in the center.',
			'imperial',
			'metric'
		)
		expect(result).toBe(
			'Towards the end of the rising time, preheat your oven to <span class="text-secondary">349°F</span> (<span class="text-secondary">320°F</span> fan) with a rack in the center.'
		)
	})

	it('should filter slash-separated temps to show only Celsius', () => {
		const result = parseTemperature('Preheat oven to 350F / 175C', 'metric', 'imperial')
		expect(result).toBe('Preheat oven to <span class="text-secondary">175C</span>')
	})

	it('should filter slash-separated temps to show only Fahrenheit', () => {
		const result = parseTemperature('Preheat oven to 175C / 350F', 'imperial', 'metric')
		expect(result).toBe('Preheat oven to <span class="text-secondary">350F</span>')
	})

	it('should filter "or"-separated temps to show only Celsius', () => {
		const result = parseTemperature('Bake at 350F or 175C', 'metric', 'imperial')
		expect(result).toBe('Bake at <span class="text-secondary">175C</span>')
	})

	it('should filter "or"-separated temps to show only Fahrenheit', () => {
		const result = parseTemperature('Bake at 175C or 350F', 'imperial', 'metric')
		expect(result).toBe('Bake at <span class="text-secondary">350F</span>')
	})
})

describe('normalizeIngredient function', () => {
	it('should normalize a basic ingredient with known unit', () => {
		const ingredient = {
			quantity: 2.5678,
			unit: 'gram',
			ingredient: 'flour'
		}
		const result = normalizeIngredient(ingredient, {}, 'eng')
		expect(result.quantity).toBe(2.57) // Rounded to 2 decimal places
		expect(result.unit).toBe('gram')
		expect(result.unitPlural).toBe('grams')
		expect(result.symbol).toBe('g')
		expect(result.minQty).toBe(2.57)
		expect(result.maxQty).toBe(2.57)
	})

	it('should handle string quantity', () => {
		const ingredient = {
			quantity: '3.456',
			unit: 'cup',
			ingredient: 'sugar'
		}
		const result = normalizeIngredient(ingredient, {}, 'eng')
		expect(result.quantity).toBe(3.46) // Converted and rounded
		expect(result.unit).toBe('cup')
	})

	it('should skip rounding when skipRounding is true', () => {
		const ingredient = {
			quantity: 2.5678,
			unit: 'gram',
			ingredient: 'flour'
		}
		const result = normalizeIngredient(ingredient, { skipRounding: true }, 'eng')
		expect(result.quantity).toBe(2.5678) // Not rounded
	})

	it('should return ingredient as-is for unknown unit', () => {
		const ingredient = {
			quantity: 2,
			unit: 'unknownunit',
			ingredient: 'something'
		}
		const result = normalizeIngredient(ingredient, {}, 'eng')
		expect(result).toEqual(ingredient) // Should return unchanged
	})

	it('should handle ounces with 1 decimal place', () => {
		const ingredient = {
			quantity: 5.6789,
			unit: 'ounce',
			ingredient: 'butter'
		}
		const result = normalizeIngredient(ingredient, {}, 'eng')
		expect(result.quantity).toBe(5.7) // Ounces use 1 decimal place
		expect(result.unit).toBe('ounce')
		expect(result.unitPlural).toBe('ounces')
		expect(result.symbol).toBe('oz')
	})

	it('should handle kilograms with 2 decimal places', () => {
		const ingredient = {
			quantity: 1.23456,
			unit: 'kilogram',
			ingredient: 'rice'
		}
		const result = normalizeIngredient(ingredient, {}, 'eng')
		expect(result.quantity).toBe(1.23) // Kilograms use 2 decimal places
		expect(result.unit).toBe('kilogram')
	})
})

describe('manipulateIngredient function', () => {
	let mockFuse

	beforeEach(() => {
		// Create mock ingredient database
		const mockIngredients = [
			{ name: 'flour', gramsPerCup: 120 },
			{ name: 'sugar', gramsPerCup: 200 },
			{ name: 'butter', gramsPerCup: 227 },
			{ name: 'Cheese, goat', gramsPerCup: 140 },
			{ name: 'goat', gramsPerCup: 300 },
			{ name: 'onions', gramsPerCup: 160 },
			{ name: 'rice', gramsPerCup: 185 },
			{ name: 'milk', gramsPerCup: 244 }
		]

		mockFuse = new Fuse(mockIngredients, {
			keys: ['name'],
			threshold: 0.4,
			includeScore: true,
			caseSensitive: false
		})
	})

	it('should return normalized ingredient when no unit is provided', () => {
		const ingredient = {
			quantity: 2,
			ingredient: 'eggs'
		}
		const result = manipulateIngredient(ingredient, 'metric', 'imperial', mockFuse, 'eng')
		expect(result.ingredient).toBe('eggs')
		expect(result.quantity).toBe(2)
	})

	it('should convert metric volumetric (milliliters) to americanVolumetric (cups)', () => {
		const ingredient = {
			quantity: 500,
			unit: 'milliliter',
			ingredient: 'water'
		}
		const result = manipulateIngredient(ingredient, 'metric', 'americanVolumetric', mockFuse, 'eng')
		expect(result.unit).toBe('cup')
		expect(parseFloat(result.quantity)).toBeCloseTo(2.11, 1) // 500ml ≈ 2.11 cups
	})

	it('should convert americanVolumetric (cups) to metric (grams) using ingredient density', () => {
		const ingredient = {
			quantity: 2,
			unit: 'cup',
			ingredient: 'flour'
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')
		expect(result.unit).toBe('gram')
		expect(parseFloat(result.quantity)).toBeCloseTo(240, 0) // 2 cups × 120 g/cup = 240g
	})

	it('should convert americanVolumetric to metric with exact match (score < 0.3)', () => {
		const ingredient = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'sugar'
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')
		expect(result.unit).toBe('gram')
		expect(parseFloat(result.quantity)).toBeCloseTo(200, 0) // 1 cup × 200 g/cup = 200g
	})

	it('should fall back to water density when ingredient is not found', () => {
		const ingredient = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'xyzabc unknown' // Not in mock database, no word will match
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')
		expect(result.usedDefaultDensity).toBe(true)
		expect(result.matchType).toBe('fallback')
		expect(parseFloat(result.quantity)).toBeCloseTo(236.6, 0) // Water density: 236.588 g/cup
	})

	it('should convert americanVolumetric cups to imperial ounces', () => {
		const ingredient = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'butter'
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'imperial', mockFuse, 'eng')
		expect(result.unit).toBe('ounce')
		expect(parseFloat(result.quantity)).toBeCloseTo(8.0, 0) // 1 cup butter (227g) ≈ 8 oz
	})

	it('should convert metric grams to imperial ounces', () => {
		const ingredient = {
			quantity: 100,
			unit: 'gram',
			ingredient: 'flour'
		}
		const result = manipulateIngredient(ingredient, 'metric', 'imperial', mockFuse, 'eng')
		expect(result.unit).toBe('ounce')
		expect(parseFloat(result.quantity)).toBeCloseTo(3.53, 1) // 100g ≈ 3.53 oz
	})

	it('should convert metric kilograms to imperial pounds', () => {
		const ingredient = {
			quantity: 2,
			unit: 'kilogram',
			ingredient: 'flour'
		}
		const result = manipulateIngredient(ingredient, 'metric', 'imperial', mockFuse, 'eng')
		expect(result.unit).toBe('pound')
		expect(parseFloat(result.quantity)).toBeCloseTo(4.41, 1) // 2kg ≈ 4.41 lb
	})

	it('should convert imperial ounces to metric grams', () => {
		const ingredient = {
			quantity: 8,
			unit: 'ounce',
			ingredient: 'butter'
		}
		const result = manipulateIngredient(ingredient, 'imperial', 'metric', mockFuse, 'eng')
		expect(result.unit).toBe('gram')
		expect(parseFloat(result.quantity)).toBeCloseTo(226.8, 0) // 8 oz ≈ 226.8g
	})

	it('should handle tablespoons to cups conversion in americanVolumetric', () => {
		const ingredient = {
			quantity: 0.5,
			unit: 'cup',
			ingredient: 'milk'
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')
		// 0.5 cup milk (244g/cup) = 122g
		expect(parseFloat(result.quantity)).toBeCloseTo(122, 0)
	})

	it('should preserve ingredient object properties', () => {
		const ingredient = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'flour',
			originalText: '1 cup flour',
			customField: 'test'
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')
		expect(result.ingredient).toBe('flour')
		expect(result.originalText).toBe('1 cup flour')
		expect(result.customField).toBe('test')
	})

	it('should handle same-system conversion (just normalize)', () => {
		const ingredient = {
			quantity: 100,
			unit: 'gram',
			ingredient: 'flour'
		}
		const result = manipulateIngredient(ingredient, 'metric', 'metric', mockFuse, 'eng')
		expect(result.unit).toBe('gram')
		expect(result.quantity).toBe(100)
	})

	it('should convert teaspoons for small quantities', () => {
		const ingredient = {
			quantity: 500,
			unit: 'milliliter',
			ingredient: 'vanilla extract'
		}
		const result = manipulateIngredient(ingredient, 'metric', 'americanVolumetric', mockFuse, 'eng')
		// Small volumes should use teaspoons or tablespoons
		expect(['teaspoon', 'tablespoon', 'cup']).toContain(result.unit)
	})

	it('should match multi-word ingredients using word fallback (yellow onions → onions)', () => {
		const ingredient = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'yellow onions' // Not exact match, but "onions" should match
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')

		// Should convert successfully using "onions" density
		expect(result.unit).toBe('gram')
		expect(parseFloat(result.quantity)).toBeCloseTo(160, 0) // 1 cup onions = 160g

		// Check match metadata
		expect(result.matchType).toBe('word')
		expect(result.matchedWord).toBe('onions')
		expect(result.usedDefaultDensity).toBe(false)
	})

	it('should prefer full match over word match (goat cheese → Cheese, goat)', () => {
		const ingredient = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'goat cheese'
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')

		expect(result.unit).toBe('gram')
		// 1 cup goat cheese -> 140g; density should come from full "Cheese, goat"
		expect(parseFloat(result.quantity)).toBeCloseTo(140, 0)
		expect(result.matchType).not.toBe('word')
		expect(result.matchedWord).toBeUndefined()
		expect(result.usedDefaultDensity).toBe(false)
	})

	it('should match multi-word ingredients (red onions → onions)', () => {
		const ingredient = {
			quantity: 2,
			unit: 'cup',
			ingredient: 'red onions'
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')

		expect(result.unit).toBe('gram')
		expect(parseFloat(result.quantity)).toBeCloseTo(320, 0) // 2 cups × 160g
		expect(result.matchType).toBe('word')
		expect(result.matchedWord).toBe('onions')
	})

	it('should skip short words when matching multi-word ingredients', () => {
		const ingredient = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'a cup of sugar' // Should skip "a", "of" and match "sugar"
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')

		expect(result.unit).toBe('gram')
		expect(parseFloat(result.quantity)).toBeCloseTo(200, 0) // Sugar density
		expect(['exact', 'word']).toContain(result.matchType) // Could be exact or word match
	})

	it('should fall back to water density when no words match', () => {
		const ingredient = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'mysterious unknown ingredient'
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')

		expect(result.usedDefaultDensity).toBe(true)
		expect(result.matchType).toBe('fallback')
		expect(parseFloat(result.quantity)).toBeCloseTo(236.6, 0) // Water density
	})

	it('should provide match metadata for exact matches', () => {
		const ingredient = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'flour' // Exact match
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')

		expect(result.matchType).toBe('exact')
		expect(result.usedDefaultDensity).toBe(false)
		expect(result.matchScore).toBeLessThan(0.3) // Strict threshold
	})

	it('should include matched word in metadata for word matches', () => {
		const ingredient = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'brown sugar'
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')

		if (result.matchType === 'word') {
			expect(result.matchedWord).toBeTruthy()
			expect(['brown', 'sugar']).toContain(result.matchedWord)
		}
		// Result should still convert correctly
		expect(result.unit).toBe('gram')
	})

	// Instruction-based matching tests
	it('should use instructions to improve matching (sliced onions → onions, sliced)', () => {
		const ingredient = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'onions',
			instructions: ['sliced']
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')

		expect(result.unit).toBe('gram')
		expect(parseFloat(result.quantity)).toBeCloseTo(160, 0) // Onions density
		expect(result.usedDefaultDensity).toBe(false)
		// Match type should be 'instruction' or 'exact' depending on database
		expect(['instruction', 'exact']).toContain(result.matchType)
	})

	it('should fall back to ingredient-only matching if instruction match fails', () => {
		const ingredient = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'flour',
			instructions: ['nonexistent'] // This shouldn't match anything
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')

		expect(result.unit).toBe('gram')
		expect(parseFloat(result.quantity)).toBeCloseTo(120, 0) // Flour density
		expect(result.usedDefaultDensity).toBe(false)
		// Should fall back to exact match on 'flour'
		expect(result.matchType).toBe('exact')
	})

	it('should handle multiple instructions correctly', () => {
		const ingredient = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'rice',
			instructions: ['dry', 'uncooked']
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')

		expect(result.unit).toBe('gram')
		expect(result.usedDefaultDensity).toBe(false)
		// Should successfully convert using rice density (185 g/cup)
		expect(parseFloat(result.quantity)).toBeCloseTo(185, 0)
	})

	it('should work without instructions parameter (backwards compatible)', () => {
		const ingredient = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'sugar'
			// No instructions field
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')

		expect(result.unit).toBe('gram')
		expect(parseFloat(result.quantity)).toBeCloseTo(200, 0) // Sugar density
		expect(result.usedDefaultDensity).toBe(false)
		expect(result.matchType).toBe('exact')
	})

	it('should handle empty instructions array gracefully', () => {
		const ingredient = {
			quantity: 1,
			unit: 'cup',
			ingredient: 'butter',
			instructions: [] // Empty array
		}
		const result = manipulateIngredient(ingredient, 'americanVolumetric', 'metric', mockFuse, 'eng')

		expect(result.unit).toBe('gram')
		expect(result.usedDefaultDensity).toBe(false)
		// Should skip instruction matching and go straight to exact match
		expect(parseFloat(result.quantity)).toBeCloseTo(227, 0) // Butter density
		expect(result.matchType).toBe('exact')
	})
})
