import { findSuitableUnit } from '$lib/utils/units.js'
import { config } from 'dotenv'
import axios from 'axios'

config()

axios.defaults.baseURL = process.env.ORIGIN || 'http://localhost:5173'

/* global describe, expect, it */

// TODO: 'unbleached bread flour' metric to americanVolumetric pass

describe('Conversion API tests', () => {
	const checkConvertedIngredient = (response, ingredientName, expectedQuantity, expectedUnit) => {
		const ingredient = response.data.find(
			(ing) => ing.ingredient === ingredientName && ing.unit === expectedUnit
		)

		if (!ingredient) {
			throw new Error(`No ingredient found with name: ${ingredientName} and unit: ${expectedUnit}`)
		}

		if (Math.abs(ingredient.quantity - expectedQuantity) > 0.01) {
			// Using 0.01 as an approximation for the 2 decimal places
			throw new Error(
				`Expected ${ingredientName} to have quantity ${expectedQuantity} but found ${ingredient.quantity}`
			)
		}

		expect(ingredient.quantity).toBeCloseTo(expectedQuantity, 2)
	}

	it('converts an array of ingredients from metric to AmVol via API', async () => {
		const payload = {
			ingredients: [
				{
					quantity: 567,
					unit: 'gram',
					ingredient: 'unbleached cake flour'
				},
				{
					quantity: 99,
					unit: 'gram',
					ingredient: 'Sparkling Sugar'
				},
				{
					quantity: 198,
					unit: 'gram',
					ingredient: 'Rice (dry)'
				},
				{
					quantity: 170,
					unit: 'gram',
					ingredient: 'Chocolate Chips'
				},
				{
					quantity: 170,
					unit: 'gram',
					ingredient: 'Chocolate Chunks'
				},
				{
					quantity: 4,
					unit: 'gram',
					ingredient: 'instant yeast'
				},
				{
					quantity: 1.25,
					unit: 'kg',
					ingredient: 'granulated sugar'
				},
				{
					quantity: 177.4,
					unit: 'gram',
					ingredient: 'water'
				},
				{
					quantity: 236.59,
					unit: 'ml',
					ingredient: 'honey'
				},
				{
					quantity: 14.8,
					unit: 'ml',
					ingredient: 'soy sauce'
				},
				{
					quantity: 6,
					unit: 'grams',
					ingredient: 'Salt (table)'
				}
			],
			fromSystem: 'metric',
			toSystem: 'americanVolumetric'
		}

		const response = await axios.post('/api/ingredients', payload)

		expect(response.status).toBe(200)
		expect(Array.isArray(response.data)).toBe(true)
		expect(response.data.length).toBe(payload.ingredients.length)

		checkConvertedIngredient(response, 'unbleached cake flour', 4.72, 'cup')
		checkConvertedIngredient(response, 'Sparkling Sugar', 0.43, 'cup')
		checkConvertedIngredient(response, 'Rice (dry)', 1, 'cup')
		checkConvertedIngredient(response, 'Chocolate Chips', 1, 'cup')
		checkConvertedIngredient(response, 'Chocolate Chunks', 1, 'cup')
		checkConvertedIngredient(response, 'instant yeast', 1.3, 'teaspoon')
		checkConvertedIngredient(response, 'granulated sugar', 6.31, 'cup')
		checkConvertedIngredient(response, 'water', 0.75, 'cup')
		checkConvertedIngredient(response, 'honey', 1, 'cup')
		checkConvertedIngredient(response, 'soy sauce', 1, 'tablespoon')
		checkConvertedIngredient(response, 'Salt (table)', 1, 'teaspoon')
	})
	it('converts an array of ingredients from metric to imperial via API', async () => {
		const payload = {
			ingredients: [
				{
					quantity: 11,
					unit: 'gram',
					ingredient: 'Salt (table)'
				},
				{
					quantity: 454,
					unit: 'gram',
					ingredient: 'Sauerkraut'
				}
			],
			fromSystem: 'metric',
			toSystem: 'imperial'
		}

		const response = await axios.post('/api/ingredients', payload)

		expect(response.status).toBe(200)
		expect(Array.isArray(response.data)).toBe(true)
		expect(response.data.length).toBe(payload.ingredients.length)

		checkConvertedIngredient(response, 'Salt (table)', 0.4, 'ounce')
		checkConvertedIngredient(response, 'Sauerkraut', 1, 'pound')
	})
	it('converts an array of ingredients from imperial to metric via API', async () => {
		const payload = {
			ingredients: [
				{
					quantity: 3,
					unit: 'pound',
					ingredient: 'Salt (table)'
				},
				{
					quantity: 1,
					unit: 'pound',
					ingredient: 'Sauerkraut'
				},
				{
					quantity: 1,
					unit: 'ounce',
					ingredient: 'Beef mince'
				}
			],
			fromSystem: 'imperial',
			toSystem: 'metric'
		}

		const response = await axios.post('/api/ingredients', payload)

		expect(response.status).toBe(200)
		expect(Array.isArray(response.data)).toBe(true)
		expect(response.data.length).toBe(payload.ingredients.length)
		checkConvertedIngredient(response, 'Salt (table)', 1.36, 'kilogram')
		checkConvertedIngredient(response, 'Sauerkraut', 453.59, 'gram')
		checkConvertedIngredient(response, 'Beef mince', 28.35, 'gram')
	})
	it('converts an array of ingredients from US Vol to imperial via API', async () => {
		const payload = {
			ingredients: [
				{
					quantity: 0.25,
					unit: 'cup',
					ingredient: 'mayonnaise'
				},
				{
					quantity: 4,
					unit: 'cup',
					ingredient: 'Chocolate Chunks'
				}
				// You can add more ingredients to this array as needed
			],
			fromSystem: 'americanVolumetric',
			toSystem: 'imperial'
		}

		const response = await axios.post('/api/ingredients', payload)
		expect(response.status).toBe(200)
		expect(Array.isArray(response.data)).toBe(true)
		expect(response.data.length).toBe(payload.ingredients.length)

		checkConvertedIngredient(response, 'mayonnaise', 2.0, 'ounce')
		checkConvertedIngredient(response, 'Chocolate Chunks', 1.5, 'pound')
	})
	it('converts an array of ingredients from US Vol to metric via API', async () => {
		const payload = {
			ingredients: [
				{
					quantity: 0.25,
					unit: 'cup',
					ingredient: 'mayonnaise'
				},
				{
					quantity: 4,
					unit: 'cup',
					ingredient: 'Beef mince'
				},
				{
					quantity: 1,
					unit: 'pound',
					ingredient: 'salt'
				},
				{
					quantity: 1.3,
					unit: 'teaspoon',
					ingredient: 'instant yeast'
				},
				{
					quantity: 1,
					unit: 'cup',
					ingredient: 'chilled water'
				},
				{
					quantity: 0.75,
					unit: 'cup',
					ingredient: 'water'
				},
				{
					quantity: 1,
					unit: 'teaspoon',
					ingredient: 'Kosher salt'
				},
				{
					quantity: 0.5,
					unit: 'cup',
					ingredient: 'Granulated sugar'
				},
				{
					quantity: 12,
					unit: 'cup',
					ingredient: 'brown sugar'
				}
			],
			fromSystem: 'americanVolumetric',
			toSystem: 'metric'
		}

		const response = await axios.post('/api/ingredients', payload)

		expect(response.status).toBe(200)
		expect(Array.isArray(response.data)).toBe(true)
		expect(response.data.length).toBe(payload.ingredients.length)
		// Validate the conversions for each ingredient
		checkConvertedIngredient(response, 'mayonnaise', 56.5, 'gram')
		checkConvertedIngredient(response, 'Beef mince', 946.35, 'gram')
		checkConvertedIngredient(response, 'salt', 453.59, 'gram')
		checkConvertedIngredient(response, 'instant yeast', 3.9, 'gram')
		checkConvertedIngredient(response, 'chilled water', 236.59, 'gram')
		checkConvertedIngredient(response, 'water', 177.4, 'gram')
		checkConvertedIngredient(response, 'Kosher salt', 4.8, 'gram')
		checkConvertedIngredient(response, 'Granulated sugar', 99, 'gram')
		checkConvertedIngredient(response, 'brown sugar', 2.6, 'kilogram')
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
