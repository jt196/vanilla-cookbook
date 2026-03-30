import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadCompatibilityManifest } from '$lib/utils/parse/compatibility/index.js'
import { mockFetchForURL } from '$lib/utils/parse/parseTesting.js'
import { parseHTML, parseURL } from '$lib/utils/parse/recipeParse.js'

/* global describe, expect, it, beforeEach, afterEach */

let originalFetch
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureDirectory = path.resolve(__dirname, '../lib/data/recipe_html')
const strictRegressionUrls = loadCompatibilityManifest()
	.filter((entry) => entry.status_class === 'active')
	.map((entry) => entry.url)

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
	strictRegressionUrls.forEach((url) => {
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

	it('fills missing Allrecipes structured fields from site selectors', async () => {
		const html = `
			<html>
				<head>
					<title>Chef John's Fresh Salmon Cakes Recipe</title>
					<meta name="description" content="Fresh salmon cakes with capers and panko.">
					<script type="application/ld+json">
						{
							"@context": "https://schema.org",
							"@type": "Recipe",
							"name": "Chef John's Fresh Salmon Cakes",
							"recipeInstructions": [
								{
									"@type": "HowToStep",
									"text": "This stale instruction should be replaced only if missing."
								}
							]
						}
					</script>
				</head>
				<body>
					<h1>Chef John's Fresh Salmon Cakes</h1>
					<div class="mntl-structured-ingredients">
						<ul class="mntl-structured-ingredients__list">
							<li class="mntl-structured-ingredients__list-item">1 tablespoon olive oil</li>
							<li class="mntl-structured-ingredients__list-item">1 pound salmon</li>
						</ul>
					</div>
					<div class="recipe__steps-content">
						<li class="mntl-sc-block-group--LI">
							<p class="mntl-sc-block-html">Gather all ingredients.</p>
						</li>
						<li class="mntl-sc-block-group--LI">
							<p class="mntl-sc-block-html">Cook the salmon cakes until golden.</p>
						</li>
					</div>
				</body>
			</html>
		`

		const recipe = await parseHTML(
			html,
			'https://www.allrecipes.com/recipe/239541/chef-johns-fresh-salmon-cakes/'
		)

		expect(recipe.name).toBe("Chef John's Fresh Salmon Cakes")
		expect(recipe.description).toBe('Fresh salmon cakes with capers and panko.')
		expect(recipe.ingredients).toEqual(['1 tablespoon olive oil', '1 pound salmon'])
		expect(recipe.instructions).toEqual(['This stale instruction should be replaced only if missing.'])
	})

	it('parses nested HowToSection instructions used by Chefkoch', async () => {
		const html = `
			<html>
				<head>
					<script type="application/ld+json">
						{
							"@context": "https://schema.org",
							"@type": "Recipe",
							"name": "Spätzle-Frittata mit Bärlauch",
							"recipeIngredient": ["200 g Spätzle", "6 Eier"],
							"recipeInstructions": [
								{
									"@type": "HowToSection",
									"name": "Zubereitung",
									"itemListElement": [
										{
											"@type": "HowToStep",
											"text": "Die Spätzle kochen und abtropfen lassen."
										},
										{
											"@type": "HowToStep",
											"text": "Die Mischung in eine Form geben und backen."
										}
									]
								}
							]
						}
					</script>
				</head>
				<body></body>
			</html>
		`

		const recipe = await parseHTML(
			html,
			'https://www.chefkoch.de/rezepte/1932021314618818/Spaetzle-Frittata-mit-Baerlauch.html'
		)

		expect(recipe.instructions).toEqual([
			'Die Spätzle kochen und abtropfen lassen.',
			'Die Mischung in eine Form geben und backen.'
		])
	})

	it('parses entity-heavy JSON-LD recipe fixtures without corrupting the JSON', async () => {
		const html = fs.readFileSync(
			path.join(fixtureDirectory, 'justataste_com_frankenstein_rice_krispie_treats_recipe_.html'),
			'utf8'
		)

		const recipe = await parseHTML(
			html,
			'https://www.justataste.com/frankenstein-rice-krispie-treats-recipe/'
		)

		expect(recipe.name).toBe('Frankenstein Rice Krispie Treats')
		expect(recipe.ingredients.length).toBeGreaterThan(0)
		expect(recipe.instructions.length).toBeGreaterThan(0)
	})

	it('ignores empty video arrays in JSON-LD recipes', async () => {
		const html = fs.readFileSync(
			path.join(
				fixtureDirectory,
				'eatsmarter_com_recipes_grilled_vegetables_with_miso_dressing.html'
			),
			'utf8'
		)

		const recipe = await parseHTML(
			html,
			'https://eatsmarter.com/recipes/grilled-vegetables-with-miso-dressing'
		)

		expect(recipe.name).toBe('Grilled Vegetables with Miso Dressing')
		expect(recipe.ingredients.length).toBe(9)
		expect(recipe.instructions.length).toBe(3)
		expect(recipe.videoUrl).toBeUndefined()
	})

	it(
		'parses every saved HTML fixture without throwing',
		async () => {
		const fixtureFiles = fs
			.readdirSync(fixtureDirectory)
			.filter((file) => file.endsWith('.html'))
			.sort()

		expect(fixtureFiles.length).toBeGreaterThan(0)

		for (const file of fixtureFiles) {
			const html = fs.readFileSync(path.join(fixtureDirectory, file), 'utf8')
			const canonicalUrl = inferFixtureUrl(html) || `https://fixture.local/${file}`

			await expect(parseHTML(html, canonicalUrl)).resolves.toBeDefined()
		}
		},
		15000
	)
})

function inferFixtureUrl(html) {
	const patterns = [
		/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
		/"mainEntityOfPage"\s*:\s*"([^"]+)"/i,
		/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i,
		/<meta[^>]+itemprop=["']url["'][^>]+content=["']([^"']+)["']/i
	]

	for (const pattern of patterns) {
		const match = html.match(pattern)
		if (match?.[1]) return match[1]
	}

	return null
}
