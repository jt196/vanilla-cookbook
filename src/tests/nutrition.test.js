import { describe, it, expect } from 'vitest'
import { parseNutritionInfo, scaleNutrition, serializeNutritionEntries } from '$lib/utils/nutrition'

describe('nutrition parser', () => {
	it('parses newline key-value format', () => {
		const parsed = parseNutritionInfo('Calories: 471 kcal\nFat: 14.1 g', 'eng')
		expect(parsed.entries.length).toBe(2)
		expect(parsed.entries[0].canonicalName).toBe('calories')
		expect(parsed.entries[0].quantity).toBe(471)
		expect(parsed.entries[0].unit).toBe('kcal')
	})

	it('parses pipe-delimited format', () => {
		const parsed = parseNutritionInfo(
			'Calories: 693kcal | Carbohydrates: 62g | Protein: 26g | Fat: 34g',
			'eng'
		)
		expect(parsed.entries.length).toBe(4)
		expect(parsed.format).toBe('kv_pipe')
	})

	it('parses semicolon sentence format and detects per-serving', () => {
		const parsed = parseNutritionInfo(
			'Per Serving: 296 calories; protein 3.7g; carbohydrates 37.8g; fat 16.3g',
			'eng'
		)
		expect(parsed.perServing).toBe(true)
		expect(parsed.entries.length).toBeGreaterThan(2)
	})

	it('uses language dictionaries and falls back to english', () => {
		const parsed = parseNutritionInfo('Kalorien: 250 kcal\nFett: 10 g', 'deu')
		expect(parsed.entries[0].canonicalName).toBe('calories')
		expect(parsed.entries[1].canonicalName).toBe('fat')
	})

	it('keeps confidence low for mostly unstructured text', () => {
		const parsed = parseNutritionInfo('This recipe is low carb and very healthy.', 'eng')
		expect(parsed.entries.length).toBe(0)
		expect(parsed.confidence).toBe(0)
	})

	it('extracts percent notes when present', () => {
		const parsed = parseNutritionInfo('Calories: 323 kcal 16%\nFat: 12 g 18%', 'eng')
		expect(parsed.entries[0].note).toBe('16%')
		expect(parsed.entries[1].note).toBe('18%')
	})
})

describe('nutrition scaling', () => {
	it('scales nutrition when not per-serving', () => {
		const parsed = parseNutritionInfo('Calories: 200 kcal\nProtein: 10 g', 'eng')
		const scaled = scaleNutrition(parsed, 2)
		expect(scaled.entries[0].quantity).toBe(400)
		expect(scaled.entries[1].quantity).toBe(20)
	})

	it('does not scale per-serving nutrition', () => {
		const parsed = parseNutritionInfo('Per serving\nCalories: 200 kcal\nProtein: 10 g', 'eng')
		const scaled = scaleNutrition(parsed, 3)
		expect(scaled.entries[0].quantity).toBe(200)
		expect(scaled.entries[1].quantity).toBe(10)
	})
})

describe('nutrition serialization', () => {
	it('prefixes per-serving outputs with locale phrase and blank line', () => {
		const parsed = parseNutritionInfo('Per serving\nCalories: 200 kcal\nProtein: 10 g', 'eng')
		const serialized = serializeNutritionEntries(parsed, 'eng')
		expect(serialized.startsWith('per serving\n\n')).toBe(true)
		expect(serialized).toContain('Calories: 200 kcal')
	})

	it('does not prefix non-per-serving outputs', () => {
		const parsed = parseNutritionInfo('Calories: 200 kcal\nProtein: 10 g', 'eng')
		const serialized = serializeNutritionEntries(parsed, 'eng')
		expect(serialized.startsWith('per serving\n\n')).toBe(false)
		expect(serialized.startsWith('Calories: 200 kcal')).toBe(true)
	})
})
