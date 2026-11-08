/**
 * Realistic unit-conversion inputs for tests, built from the public recipe pages saved in
 * src/lib/data/recipe_html (no user data): each recipe's ingredients are parsed the way the
 * recipe page parses them, then converted from the recipe's own system to the others.
 */
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { parseRecipe } from '$lib/utils/parse/recipeParse.js'
import { ingredientProcess } from '$lib/utils/filters.js'
import { determineSystem } from '$lib/utils/converter.js'

const FIXTURE_DIR = path.resolve('src/lib/data/recipe_html')
const INGREDIENT_CSV = path.resolve('src/lib/data/ingredients/dry_ingredient_data.csv')
const SYSTEMS = ['metric', 'americanVolumetric', 'imperial']

/**
 * The ingredient density table exactly as the seed script loads it, in database order.
 *
 * @returns {Promise<Array<{ id: number, name: string, gramsPerCup: number }>>}
 */
export function loadIngredientRows() {
	return new Promise((resolve, reject) => {
		const rows = []
		fs.createReadStream(INGREDIENT_CSV)
			.pipe(csv({ separator: ',' }))
			.on('data', (row) =>
				rows.push({ id: rows.length + 1, name: row.name, gramsPerCup: parseFloat(row.gramsPerCup) })
			)
			.on('end', () => resolve(rows))
			.on('error', reject)
	})
}

/**
 * Conversion requests for the first `limit` saved recipes (sorted by file name), one per
 * target system other than the recipe's own.
 *
 * @param {number} limit
 * @returns {Array<{ recipe: string, fromSystem: string, toSystem: string, ingredients: object[] }>}
 */
export function buildConversionCases(limit) {
	const cases = []
	for (const file of fs.readdirSync(FIXTURE_DIR).sort().slice(0, limit)) {
		const recipe = parseRecipe(fs.readFileSync(path.join(FIXTURE_DIR, file), 'utf8'), '')
		if (typeof recipe !== 'object' || !recipe.ingredients?.length) continue
		const ingredients = ingredientProcess(recipe.ingredients, 'eng')
		const fromSystem = determineSystem(ingredients).system
		for (const toSystem of SYSTEMS) {
			if (toSystem !== fromSystem) cases.push({ recipe: file, fromSystem, toSystem, ingredients })
		}
	}
	return cases
}
