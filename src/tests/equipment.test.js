import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import { parseTools } from '$lib/utils/parse/parseHelpers.js'
import { parseHTML } from '$lib/utils/parse/recipeParse.js'
import { formatScrapedRecipe } from '$lib/utils/parse/parseHelpersClient.js'

const fixtureDirectory = path.resolve(process.cwd(), 'src/lib/data/recipe_html')

describe('parseTools', () => {
	it('accepts a single string', () => {
		expect(parseTools('Stand mixer')).toEqual(['Stand mixer'])
	})

	it('accepts HowToTool objects and plain strings, nested or mixed', () => {
		expect(
			parseTools([
				{ '@type': 'HowToTool', name: 'Dutch oven' },
				'Whisk',
				[{ '@type': 'HowToTool', text: 'Baking tray' }]
			])
		).toEqual(['Dutch oven', 'Whisk', 'Baking tray'])
	})

	it('trims, collapses whitespace and drops empties and case-insensitive duplicates', () => {
		expect(parseTools(['  Whisk ', 'whisk', '', null, 'Hand   blender', { name: '' }])).toEqual([
			'Whisk',
			'Hand blender'
		])
	})

	it('returns an empty list when there is no tool data', () => {
		expect(parseTools(undefined)).toEqual([])
		expect(parseTools([])).toEqual([])
		expect(parseTools({ '@type': 'HowToTool' })).toEqual([])
	})
})

describe('equipment scraping', () => {
	it('reads schema.org tool from JSON-LD', async () => {
		const jsonLd = {
			'@context': 'https://schema.org',
			'@type': 'Recipe',
			name: 'Homemade Butter',
			recipeIngredient: ['500 ml double cream', '1 pinch salt'],
			recipeInstructions: ['Whip the cream until it splits.', 'Drain and rinse the butter.'],
			tool: [{ '@type': 'HowToTool', name: 'Stand mixer with whisk attachment' }, 'Muslin cloth']
		}
		const html = `<html><head><script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head><body></body></html>`

		const recipe = await parseHTML(html, 'https://example.com/homemade-butter')

		expect(recipe.equipment).toEqual(['Stand mixer with whisk attachment', 'Muslin cloth'])
	})

	it('reads itemprop="tool" microdata (rezeptwelt.de fixture)', async () => {
		const html = fs.readFileSync(
			path.join(
				fixtureDirectory,
				'rezeptwelt_de_brot_broetchen_rezepte_croissant_xl_hoernchen_5g5qz9pu_d6d98_490713_cfcd2_n3rrs0lq.html'
			),
			'utf8'
		)

		const recipe = await parseHTML(
			html,
			'https://www.rezeptwelt.de/brot-broetchen-rezepte/croissant-xl-hoernchen/5g5qz9pu-d6d98-490713-cfcd2-n3rrs0lq'
		)

		expect(recipe.equipment).toEqual([
			'Spatel',
			'Sasa Vorbereitungsmatte',
			'Pizzastein Paul',
			'Spülbürste Set',
			'2. Mixtopf TM6'
		])
	})

	it('leaves equipment empty for recipes without tool data', async () => {
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
		expect(recipe.equipment).toEqual([])
	})
})

describe('formatScrapedRecipe equipment', () => {
	it('joins equipment one per line', () => {
		expect(formatScrapedRecipe({ equipment: ['Whisk', 'Baking tray'] }).equipment).toBe(
			'Whisk\nBaking tray'
		)
	})

	it('defaults to an empty string', () => {
		expect(formatScrapedRecipe({}).equipment).toBe('')
	})
})
