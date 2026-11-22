import { describe, it, expect } from 'vitest'
import {
	isSpoonUnit,
	formatScaledQuantity,
	formatIngredientAmount
} from '$lib/utils/ingredientAmount'
import { ingredientProcess } from '$lib/utils/filters'
import { parseRecipeText, normalizeIngredient } from '$lib/utils/converter'

describe('isSpoonUnit', () => {
	it.each([
		['teaspoon', 'eng'],
		['Tablespoons', 'eng'],
		['tbsp', 'eng'],
		['Teelöffel', 'deu'],
		['EL', 'deu'],
		['cucchiaino', 'ita'],
		// Converted ingredients can carry English unit names in any language
		['teaspoon', 'deu']
	])('recognizes %s (%s)', (unit, lang) => {
		expect(isSpoonUnit(unit, lang)).toBe(true)
	})

	it.each([['gram'], ['cup'], ['pinch'], [''], [null], [undefined]])('rejects %s', (unit) => {
		expect(isSpoonUnit(unit, 'eng')).toBe(false)
	})
})

describe('formatScaledQuantity', () => {
	it('uses fractions for spoon measures in metric', () => {
		expect(formatScaledQuantity(0.25, 0.25, 0.25, 'teaspoon', 1, 'metric')).toBe('¼')
		expect(formatScaledQuantity(0.125, 0.125, 0.125, 'tsp', 1, 'metric')).toBe('⅛')
		expect(formatScaledQuantity(1.5, 1.5, 1.5, 'Esslöffel', 1, 'metric', 'deu')).toBe('1½')
	})

	it('scales spoon fractions and ranges', () => {
		expect(formatScaledQuantity(0.5, 0.5, 0.5, 'teaspoon', 0.5, 'metric')).toBe('¼')
		expect(formatScaledQuantity(1, 1, 2, 'tablespoon', 0.5, 'metric')).toBe('½-1')
	})

	it('keeps rounded decimals for other metric units', () => {
		expect(formatScaledQuantity(0.25, 0.25, 0.25, 'kilogram', 1, 'metric')).toBe('0.3')
		expect(formatScaledQuantity(150, 150, 150, 'gram', 1, 'metric')).toBe('150')
	})

	it('uses fractions outside metric as before', () => {
		expect(formatScaledQuantity(0.25, 0.25, 0.25, 'cup', 1, 'americanVolumetric')).toBe('¼')
	})
})

describe('spoon fractions end to end', () => {
	it('shows a German ¼ TL as a fraction in metric', () => {
		const [salz] = ingredientProcess(['1/4 TL Salz'], 'deu')
		expect(formatIngredientAmount(salz, { system: 'metric', lang: 'deu', useSymbol: true })).toBe(
			'¼ TL'
		)
	})

	// The recipe view normalizes parsed ingredients before display (rounding to unit precision)
	it.each([
		['1/4 EL Öl', 'deu', 'metric', '¼ EL'],
		['1/4 tbsp oil', 'eng', 'metric', '¼ tbs'],
		['1/8 tsp salt', 'eng', 'americanVolumetric', '⅛ tsp'],
		['1/3 cup milk', 'eng', 'americanVolumetric', '⅓ c']
	])('keeps %s as written after normalizing (%s, %s)', (line, lang, system, expected) => {
		const [parsed] = ingredientProcess([line], lang)
		const normalized = normalizeIngredient(parsed, {}, lang)
		expect(formatIngredientAmount(normalized, { system, lang, useSymbol: true })).toBe(expected)
	})

	it('shows spoon fractions in direction markers', () => {
		const ingredients = ingredientProcess(['1/4 tsp salt'], 'eng')
		const html = parseRecipeText(['Add the {salt}.'], 'metric', 'metric', ingredients, 'eng')[0]
		expect(html).toContain('(¼ teaspoon)')
	})
})
