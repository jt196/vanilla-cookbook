import { describe, it, expect } from 'vitest'
import { buildCommands, filterCommands, importUrlFrom } from '$lib/utils/commandPalette'

const labels = {
	'nav.myRecipes': 'My Recipes',
	'nav.allRecipes': 'All Recipes',
	'nav.newRecipe': 'New Recipe',
	'nav.shoppingList': 'Shopping list',
	'nav.calendar': 'Calendar',
	'nav.settings': 'Settings',
	'palette.import': 'Import recipes',
	'palette.switchTheme': 'Switch theme'
}
const label = (command) => labels[command.labelKey] ?? command.labelKey
const ids = (commands) => commands.map((c) => c.id)

describe('buildCommands', () => {
	it('gives logged-in users their pages, with user-scoped links', () => {
		const commands = buildCommands({ userId: 'u1' }, 'auto')
		expect(ids(commands)).toEqual([
			'myRecipes',
			'allRecipes',
			'newRecipe',
			'shopping',
			'calendar',
			'import',
			'settings',
			'theme-light',
			'theme-dracula'
		])
		expect(commands.find((c) => c.id === 'shopping').href).toBe('/user/u1/shopping')
	})

	it('adds admin pages for admins', () => {
		const commands = buildCommands({ userId: 'a1', isAdmin: true }, 'auto')
		expect(ids(commands)).toEqual(expect.arrayContaining(['site', 'users']))
		expect(commands.find((c) => c.id === 'users').href).toBe('/user/a1/options/admin/users')
	})

	it('gives visitors public pages and login only', () => {
		expect(ids(buildCommands(null, 'light'))).toEqual([
			'allRecipes',
			'login',
			'theme-dracula',
			'theme-auto'
		])
	})

	it('never offers the theme already in use', () => {
		const themes = buildCommands(null, 'dracula').filter((c) => c.theme)
		expect(themes.map((c) => c.theme)).toEqual(['light', 'auto'])
	})
})

describe('filterCommands', () => {
	const commands = buildCommands({ userId: 'u1' }, 'auto')

	it('returns everything for an empty query', () => {
		expect(filterCommands(commands, '  ', label)).toEqual(commands)
	})

	it('matches labels and keywords case-insensitively', () => {
		expect(ids(filterCommands(commands, 'SHOP', label))).toEqual(['shopping'])
		expect(ids(filterCommands(commands, 'groceries', label))).toEqual(['shopping'])
		expect(ids(filterCommands(commands, 'dark mode', label))).toEqual([
			'theme-light',
			'theme-dracula'
		])
	})

	it('requires every word to match', () => {
		expect(filterCommands(commands, 'shopping calendar', label)).toEqual([])
	})
})

describe('importUrlFrom', () => {
	it('recognises http(s) URLs', () => {
		expect(importUrlFrom(' https://example.com/soup ')?.hostname).toBe('example.com')
		expect(importUrlFrom('http://example.com')?.href).toBe('http://example.com/')
	})

	it.each(['soup', 'example.com/soup', 'ftp://example.com', 'https://exa mple.com'])(
		'ignores %s',
		(query) => {
			expect(importUrlFrom(query)).toBeNull()
		}
	)
})
