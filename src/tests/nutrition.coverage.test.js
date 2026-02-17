import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import { parseNutritionInfo } from '$lib/utils/nutrition'

const samplePath = path.join(process.cwd(), 'src', 'tests', 'fixtures', 'nutrition-sample.json')
const sampleRows = JSON.parse(fs.readFileSync(samplePath, 'utf8'))

function canRenderTable(parsed) {
	return parsed.entries.length > 0 && parsed.confidence >= 0.4
}

describe('nutrition parser fixture coverage', () => {
	it('meets the 80% table-render coverage target on fixture dataset', () => {
		let renderable = 0

		for (const row of sampleRows) {
			const parsed = parseNutritionInfo(row.nutritional_info || '', 'eng')
			if (canRenderTable(parsed)) {
				renderable += 1
			}
		}

		const ratio = renderable / sampleRows.length
		// Keep assertion strict enough to catch regressions but stable for CI.
		expect(ratio).toBeGreaterThanOrEqual(0.8)
	})
})
