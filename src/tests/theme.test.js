import { describe, it, expect } from 'vitest'
import { normalizeThemePreference, resolveTheme, isValidThemePreference } from '$lib/utils/theme.js'

describe('normalizeThemePreference', () => {
	it('keeps light, dark and auto', () => {
		expect(normalizeThemePreference('light')).toBe('light')
		expect(normalizeThemePreference('dracula')).toBe('dracula')
		expect(normalizeThemePreference('auto')).toBe('auto')
	})

	it('maps the legacy dark value to dracula', () => {
		expect(normalizeThemePreference('dark')).toBe('dracula')
	})

	it('falls back to auto for missing or unknown values', () => {
		expect(normalizeThemePreference(null)).toBe('auto')
		expect(normalizeThemePreference(undefined)).toBe('auto')
		expect(normalizeThemePreference('cupcake')).toBe('auto')
	})
})

describe('resolveTheme', () => {
	it('follows the system setting in auto mode', () => {
		expect(resolveTheme('auto', true)).toBe('dracula')
		expect(resolveTheme('auto', false)).toBe('light')
	})

	it('ignores the system setting for an explicit choice', () => {
		expect(resolveTheme('light', true)).toBe('light')
		expect(resolveTheme('dracula', false)).toBe('dracula')
		expect(resolveTheme('dark', false)).toBe('dracula')
	})
})

describe('isValidThemePreference', () => {
	it('accepts known preferences including legacy dark', () => {
		for (const value of ['light', 'dracula', 'auto', 'dark']) {
			expect(isValidThemePreference(value)).toBe(true)
		}
	})

	it('rejects anything else', () => {
		for (const value of ['', 'cupcake', null, undefined, 1, {}]) {
			expect(isValidThemePreference(value)).toBe(false)
		}
	})
})
