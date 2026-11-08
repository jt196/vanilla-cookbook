import { describe, it, expect, vi, beforeAll } from 'vitest'

const ingredientTable = vi.hoisted(() => ({ rows: [] }))
vi.mock('$lib/server/prisma', () => ({
	prisma: { ingredient: { findMany: async () => ingredientTable.rows } }
}))

import Fuse from 'fuse.js'
import { convertIngredientsBackend, clearIngredientCache } from '$lib/utils/converterBackend.js'
import { buildConversionCases, loadIngredientRows } from './helpers/conversionCases.js'

/**
 * Golden snapshot of unit conversion results for realistic recipes. Performance work on the
 * ingredient lookup must not change any of these results; if a change is intended (e.g.
 * better matching), review the diff and update with `pnpm test -- -u`.
 */
// 401 at the time of writing (was 1340 before search results were cached)
const FIRST_PASS_BUDGET = 450

describe('unit conversion golden snapshot', () => {
	beforeAll(async () => {
		ingredientTable.rows = await loadIngredientRows()
		clearIngredientCache()
	})

	it('converts 60 saved recipes between every unit system exactly as before', async () => {
		vi.spyOn(console, 'log').mockImplementation(() => {})
		vi.spyOn(console, 'error').mockImplementation(() => {})
		const results = []
		for (const { recipe, fromSystem, toSystem, ingredients } of buildConversionCases(60)) {
			const converted = await convertIngredientsBackend(
				ingredients,
				fromSystem,
				toSystem,
				false,
				'eng'
			)
			results.push({ recipe, fromSystem, toSystem, converted })
		}
		vi.restoreAllMocks()
		await expect(JSON.stringify(results, null, 1) + '\n').toMatchFileSnapshot(
			'./__snapshots__/conversion.golden.json'
		)
	}, 120000)

	// Speed guard that doesn't depend on machine speed: fuzzy search is ~90% of conversion
	// time, so count searches. A repeat conversion must not search at all (results are
	// cached per index), and a first pass must stay within budget.
	it('keeps fuzzy searches within budget', async () => {
		vi.spyOn(console, 'log').mockImplementation(() => {})
		vi.spyOn(console, 'error').mockImplementation(() => {})
		clearIngredientCache()
		const search = vi.spyOn(Fuse.prototype, 'search')
		const cases = buildConversionCases(60)
		const runAll = async () => {
			for (const { fromSystem, toSystem, ingredients } of cases)
				await convertIngredientsBackend(ingredients, fromSystem, toSystem, false, 'eng')
		}
		await runAll()
		const firstPass = search.mock.calls.length
		search.mockClear()
		await runAll()
		const repeatPass = search.mock.calls.length
		vi.restoreAllMocks()
		expect(repeatPass).toBe(0)
		expect(firstPass).toBeLessThanOrEqual(FIRST_PASS_BUDGET)
	}, 120000)
})
