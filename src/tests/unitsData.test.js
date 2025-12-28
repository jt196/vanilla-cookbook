// @vitest-environment node

import { describe, it, expect } from 'vitest'
import {
	unitsData,
	findUnitFromName,
	getUnitData,
	toOldUnitsFormat,
	toParserI18nFormat,
	getUnitsForSystem,
	shouldSkipUnitConversion
} from '$lib/utils/unitsData.js'

describe('unitsData structure', () => {
	it('should have all core units defined', () => {
		expect(unitsData).toBeDefined()
		expect(unitsData.gram).toBeDefined()
		expect(unitsData.kilogram).toBeDefined()
		expect(unitsData.ounce).toBeDefined()
		expect(unitsData.pound).toBeDefined()
		expect(unitsData.cup).toBeDefined()
		expect(unitsData.teaspoon).toBeDefined()
		expect(unitsData.tablespoon).toBeDefined()
	})

	it('should have correct structure for each unit', () => {
		const gramData = unitsData.gram

		expect(gramData.names).toBeInstanceOf(Array)
		expect(gramData.names.length).toBeGreaterThan(0)
		expect(gramData.plural).toBe('grams')
		expect(gramData.symbol).toBe('g')
		expect(gramData.system).toBe('metric')
		expect(gramData.grams).toBe(1)
		expect(gramData.skipConversion).toBe(false)
		expect(gramData.decimalPlaces).toBe(2)
	})

	it('should have volume units with null grams', () => {
		expect(unitsData.cup.grams).toBeNull()
		expect(unitsData.teaspoon.grams).toBeNull()
		expect(unitsData.tablespoon.grams).toBeNull()
	})

	it('should mark small units as skipConversion', () => {
		expect(unitsData.pinch.skipConversion).toBe(true)
		expect(unitsData.dash.skipConversion).toBe(true)
		expect(unitsData.drop.skipConversion).toBe(true)
	})
})

describe('findUnitFromName', () => {
	it('should find unit by exact canonical name', () => {
		const result = findUnitFromName('gram')
		expect(result).toBeDefined()
		expect(result.canonical).toBe('gram')
		expect(result.plural).toBe('grams')
	})

	it('should find unit by variant name', () => {
		const result = findUnitFromName('g')
		expect(result).toBeDefined()
		expect(result.canonical).toBe('gram')
	})

	it('should find unit by plural variant', () => {
		const result = findUnitFromName('grams')
		expect(result).toBeDefined()
		expect(result.canonical).toBe('gram')
	})

	it('should be case insensitive', () => {
		const result1 = findUnitFromName('G')
		const result2 = findUnitFromName('GRAM')
		const result3 = findUnitFromName('Grams')

		expect(result1.canonical).toBe('gram')
		expect(result2.canonical).toBe('gram')
		expect(result3.canonical).toBe('gram')
	})

	it('should return null for unknown units', () => {
		const result = findUnitFromName('gramm') // German - not yet supported
		expect(result).toBeNull()
	})

	it('should find abbreviations', () => {
		expect(findUnitFromName('oz').canonical).toBe('ounce')
		expect(findUnitFromName('lb').canonical).toBe('pound')
		expect(findUnitFromName('kg').canonical).toBe('kilogram')
		expect(findUnitFromName('tsp').canonical).toBe('teaspoon')
		expect(findUnitFromName('tbsp').canonical).toBe('tablespoon')
	})

	it('should find units with periods', () => {
		expect(findUnitFromName('g.').canonical).toBe('gram')
		expect(findUnitFromName('oz.').canonical).toBe('ounce')
		expect(findUnitFromName('lb.').canonical).toBe('pound')
	})
})

describe('getUnitData', () => {
	it('should return data for valid canonical name', () => {
		const data = getUnitData('gram')
		expect(data).toBeDefined()
		expect(data.names).toContain('gram')
		expect(data.names).toContain('g')
	})

	it('should return null for invalid canonical name', () => {
		const data = getUnitData('notaunit')
		expect(data).toBeNull()
	})
})

describe('toOldUnitsFormat', () => {
	it('should convert to old units.js array format', () => {
		const oldFormat = toOldUnitsFormat()

		expect(Array.isArray(oldFormat)).toBe(true)
		expect(oldFormat.length).toBeGreaterThan(0)
	})

	it('should have correct structure for each entry', () => {
		const oldFormat = toOldUnitsFormat()
		const firstUnit = oldFormat[0]

		expect(firstUnit.names).toBeInstanceOf(Array)
		expect(typeof firstUnit.grams).toBe('number')
		expect(typeof firstUnit.skipConversion).toBe('boolean')
		expect(typeof firstUnit.decimalPlaces).toBe('number')
	})

	it('should convert null grams to 0 for old format', () => {
		const oldFormat = toOldUnitsFormat()
		const cupUnit = oldFormat.find(u => u.names.includes('cup'))

		expect(cupUnit.grams).toBe(0) // null → 0 for backwards compatibility
	})

	it('should preserve conversion metadata', () => {
		const oldFormat = toOldUnitsFormat()
		const gramUnit = oldFormat.find(u => u.names.includes('gram'))
		const pinchUnit = oldFormat.find(u => u.names.includes('pinch'))

		expect(gramUnit.grams).toBe(1)
		expect(gramUnit.skipConversion).toBe(false)
		expect(gramUnit.decimalPlaces).toBe(2)

		expect(pinchUnit.skipConversion).toBe(true)
	})
})

describe('toParserI18nFormat', () => {
	it('should convert to parser i18n format', () => {
		const i18n = toParserI18nFormat()

		expect(i18n.units).toBeDefined()
		expect(i18n.pluralUnits).toBeDefined()
		expect(i18n.symbolUnits).toBeDefined()
		expect(i18n.unitSystems).toBeDefined()
	})

	it('should have matching keys across all objects', () => {
		const i18n = toParserI18nFormat()

		expect(i18n.units.gram).toEqual(unitsData.gram.names)
		expect(i18n.pluralUnits.gram).toBe(unitsData.gram.plural)
		expect(i18n.symbolUnits.gram).toBe(unitsData.gram.symbol)
		expect(i18n.unitSystems.gram).toBe(unitsData.gram.system)
	})

	it('should only include units with systems in unitSystems', () => {
		const i18n = toParserI18nFormat()

		// gram has a system
		expect(i18n.unitSystems.gram).toBe('metric')

		// pinch has no system (null)
		expect(i18n.unitSystems.pinch).toBeUndefined()
	})

	it('should have array values in units object', () => {
		const i18n = toParserI18nFormat()

		expect(Array.isArray(i18n.units.gram)).toBe(true)
		expect(i18n.units.gram).toContain('gram')
		expect(i18n.units.gram).toContain('g')
	})
})

describe('getUnitsForSystem', () => {
	it('should return all metric units', () => {
		const metricUnits = getUnitsForSystem('metric')

		expect(metricUnits).toContain('gram')
		expect(metricUnits).toContain('kilogram')
		expect(metricUnits).toContain('milligram')
		expect(metricUnits).toContain('liter')
		expect(metricUnits).toContain('milliliter')
	})

	it('should return all imperial units', () => {
		const imperialUnits = getUnitsForSystem('imperial')

		expect(imperialUnits).toContain('ounce')
		expect(imperialUnits).toContain('pound')
		expect(imperialUnits).toContain('floz')
	})

	it('should return all americanVolumetric units', () => {
		const usUnits = getUnitsForSystem('americanVolumetric')

		expect(usUnits).toContain('cup')
		expect(usUnits).toContain('teaspoon')
		expect(usUnits).toContain('tablespoon')
		expect(usUnits).toContain('pint')
		expect(usUnits).toContain('quart')
		expect(usUnits).toContain('gallon')
	})

	it('should not include units without a system', () => {
		const metricUnits = getUnitsForSystem('metric')
		const imperialUnits = getUnitsForSystem('imperial')
		const usUnits = getUnitsForSystem('americanVolumetric')

		expect(metricUnits).not.toContain('pinch')
		expect(imperialUnits).not.toContain('pinch')
		expect(usUnits).not.toContain('pinch')
	})
})

describe('shouldSkipUnitConversion', () => {
	it('should return true for small units', () => {
		expect(shouldSkipUnitConversion('pinch')).toBe(true)
		expect(shouldSkipUnitConversion('dash')).toBe(true)
		expect(shouldSkipUnitConversion('drop')).toBe(true)
	})

	it('should return false for standard units', () => {
		expect(shouldSkipUnitConversion('gram')).toBe(false)
		expect(shouldSkipUnitConversion('ounce')).toBe(false)
		expect(shouldSkipUnitConversion('cup')).toBe(false)
	})

	it('should work with variants', () => {
		expect(shouldSkipUnitConversion('g')).toBe(false)
		expect(shouldSkipUnitConversion('oz')).toBe(false)
	})

	it('should return false for unknown units', () => {
		expect(shouldSkipUnitConversion('notaunit')).toBe(false)
	})
})

describe('Multi-language support readiness', () => {
	it('should have structure that can accommodate language variants', () => {
		// Current structure: names array can hold all languages
		// This test verifies we can extend to multi-language without breaking changes

		const gramData = unitsData.gram
		expect(gramData.names).toBeInstanceOf(Array)

		// In future, we could add: gramData.names = ['gram', 'g', 'gramm', 'gramme', ...]
		// without changing the structure
	})
})

describe('Data integrity', () => {
	it('should not have duplicate names across different units', () => {
		const allNames = new Set()
		const duplicates = []

		for (const [canonical, data] of Object.entries(unitsData)) {
			for (const name of data.names) {
				if (allNames.has(name)) {
					duplicates.push({ name, unit: canonical })
				}
				allNames.add(name)
			}
		}

		expect(duplicates).toEqual([]) // Should have no duplicates
	})

	it('should have consistent decimal places for weight units', () => {
		// Weight units should generally have 1-2 decimal places
		expect(unitsData.gram.decimalPlaces).toBeGreaterThanOrEqual(1)
		expect(unitsData.kilogram.decimalPlaces).toBeGreaterThanOrEqual(1)
		expect(unitsData.ounce.decimalPlaces).toBeGreaterThanOrEqual(1)
		expect(unitsData.pound.decimalPlaces).toBeGreaterThanOrEqual(1)
	})

	it('should have correct gram conversions for common weights', () => {
		expect(unitsData.milligram.grams).toBe(0.001)
		expect(unitsData.gram.grams).toBe(1)
		expect(unitsData.kilogram.grams).toBe(1000)
		expect(unitsData.ounce.grams).toBe(28.35)
		expect(unitsData.pound.grams).toBe(453.592)
	})
})
