import { converter, parseTemperature } from '$lib/utils/converter.js'

/* global describe, expect, it */

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
	it('should convert "Preheat the oven to 180°C (350°F), Gas Mark 4." to "Preheat the oven to 180°C."', () => {
		const result = parseTemperature(
			'Preheat the oven to 180°C (350°F), Gas Mark 4.',
			'metric',
			'imperial'
		)
		expect(result).toBe('Preheat the oven to 180°C (350°F), Gas Mark 4.')
	})

	it('should convert "Preheat the oven to 350ºF"', () => {
		const result = parseTemperature('Preheat the oven to 350ºF', 'metric', 'imperial')
		expect(result).toBe('Preheat the oven to **177°C**')
	})

	it('should convert "Preheat the oven to 350 degrees Fahrenheit"', () => {
		const result = parseTemperature(
			'Preheat the oven to 350 degrees Fahrenheit',
			'metric',
			'imperial'
		)
		expect(result).toBe('Preheat the oven to **177°C**')
	})

	it('should convert "Preheat the oven to 180°C (350°F), Gas Mark 4."', () => {
		const result = parseTemperature(
			'Preheat the oven to 180°C (350°F), Gas Mark 4.',
			'imperial',
			'metric'
		)
		expect(result).toBe('Preheat the oven to 180°C (350°F), Gas Mark 4.')
	})

	it('should not change "Bake for 30–35 minutes or until golden."', () => {
		const result = parseTemperature('Bake for 30–35 minutes or until golden.', 'metric', 'imperial')
		expect(result).toBe('Bake for 30–35 minutes or until golden.')
	})

	it('should convert "Preheat oven to 340 degrees F (171 C)."', () => {
		const result = parseTemperature('Preheat oven to 340 degrees F (171 C).', 'metric', 'imperial')
		expect(result).toBe('Preheat oven to 340 degrees F (171 C).')
	})

	it('should convert "turn the oven on to heat up to 220ºC (fan)."', () => {
		const result = parseTemperature('turn the oven on to heat up to 220ºC (fan).', 'imperial')
		expect(result).toBe('turn the oven on to heat up to **428°F** (fan).')
	})

	it('should convert "Preheat a Philips air fryer to 200-205C"', () => {
		const result = parseTemperature('Preheat a Philips air fryer to 200-205C.', 'imperial')
		expect(result).toBe('Preheat a Philips air fryer to **392-401°F**.')
	})

	it('should convert "Preheat a Philips air fryer to 392-401°F."', () => {
		const result = parseTemperature('Preheat a Philips air fryer to 392-401°F.', 'metric')
		expect(result).toBe('Preheat a Philips air fryer to **200-205°C**.')
	})

	it('should convert "Preheat the oven to 170°C. Then do something else."', () => {
		const result = parseTemperature(
			'Preheat the oven to 170°C. Then do something else.',
			'imperial'
		)
		expect(result).toBe('Preheat the oven to **338°F**. Then do something else.')
	})

	it('should convert "be sure to cook them until they register 175 degrees."', () => {
		const result = parseTemperature(
			'be sure to cook them until they register 175 degrees.',
			'metric',
			'imperial'
		)
		expect(result).toBe('be sure to cook them until they register **79°C**.')
	})

	it('should convert "Spread in a greased 13 x 9-inch pan, bake 25-30 minutes at 375F, let cool and cut into bars."', () => {
		const result = parseTemperature(
			'Spread in a greased 13 x 9-inch pan, bake 25-30 minutes at 375F, let cool and cut into bars.',
			'metric',
			'imperial'
		)
		expect(result).toBe(
			'Spread in a greased 13 x 9-inch pan, bake 25-30 minutes at **191°C**, let cool and cut into bars.'
		)
	})

	it('should convert "Bake at 145C (fan), 160C (no fan) until lightly browned"', () => {
		const result = parseTemperature(
			'Bake at 145C (fan), 160C (no fan) until lightly browned',
			'imperial',
			'metric'
		)
		expect(result).toBe('Bake at **293°F** (fan), **320°F** (no fan) until lightly browned')
	})

	it('should convert "Meanwhile, adjust an oven rack to the middle position and heat the oven to 450 degrees."', () => {
		const result = parseTemperature(
			'Meanwhile, adjust an oven rack to the middle position and heat the oven to 450 degrees.',
			'metric',
			'imperial'
		)
		expect(result).toBe(
			'Meanwhile, adjust an oven rack to the middle position and heat the oven to **232°C**.'
		)
	})

	it('should convert "218°C (205C convection)"', () => {
		const result = parseTemperature('218°C (205C convection)', 'imperial', 'metric')
		expect(result).toBe('**424°F** (**401°F** convection)')
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
		expect(result).toBe('Heat oven to **356°F**/**320°F** fan/gas 4.')
	})

	it('should convert "Towards the end of the rising time, preheat your oven to 176C (160C fan) with a rack in the center."', () => {
		const result = parseTemperature(
			'Towards the end of the rising time, preheat your oven to 176C (160C fan) with a rack in the center.',
			'imperial',
			'metric'
		)
		expect(result).toBe(
			'Towards the end of the rising time, preheat your oven to **349°F** (**320°F** fan) with a rack in the center.'
		)
	})
})
