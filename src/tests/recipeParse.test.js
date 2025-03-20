import { mockFetchForURL } from '$lib/utils/parse/parseTesting.js'
import { parseURL } from '$lib/utils/parse/recipeParse.js'
import { sites } from '$lib/utils/parse/downloadRecipes.js'

/* global describe, expect, it, beforeEach, afterEach */

let originalFetch

// Save the original fetch function before running any tests
beforeEach(() => {
	originalFetch = global.fetch
	mockFetchForURL()
})

// Restore the original fetch function after each test
afterEach(() => {
	global.fetch = originalFetch
})

describe('parseURL function', () => {
	sites.forEach((url) => {
		it(`should return a recipe object with non-null keys for URL: ${url}`, async () => {
			// Assuming parseURL is an async function
			let recipe
			try {
				const { parsedHTML } = await parseURL(url)
				recipe = parsedHTML
			} catch (error) {
				console.log('Error:', error)
			}
			// Define the keys you expect to be non-null
			const expectedNonNullKeys = [
				'name',
				'author',
				'sourceUrl',
				'cookTime',
				'ingredients',
				'instructions'
			]
			console.log(typeof recipe.ingredients)
			expect(Array.isArray(recipe.ingredients)).toBe(true)
			expect(recipe.ingredients.length).toBeGreaterThan(0)

			// Check each key
			expectedNonNullKeys.forEach((key) => {
				expect(recipe[key]).not.toBeNull()
			})
		})
	})
})
