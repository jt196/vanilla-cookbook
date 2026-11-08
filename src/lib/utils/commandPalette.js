/**
 * Commands for the ⌘K command palette: pure data and matching, so the component only
 * handles rendering and keyboard input.
 *
 * @module commandPalette
 */
import { themePreferences, THEME_AUTO, THEME_DARK, THEME_LIGHT } from '$lib/utils/theme.js'

/**
 * @typedef {Object} Command
 * @property {string} id
 * @property {'goto' | 'actions'} group
 * @property {string} labelKey - i18n key for the label
 * @property {Record<string, string>} [labelVars]
 * @property {string} icon - Name of an icon component (see CommandPalette.svelte)
 * @property {string} [href] - Navigate here when chosen
 * @property {string} [theme] - Switch to this theme when chosen
 * @property {string[]} [keywords] - Extra words to match on (English)
 */

/**
 * The commands available to a viewer.
 *
 * @param {{ userId: string, isAdmin?: boolean } | null} user
 * @param {string} [currentTheme] - Omits the action for the theme already in use
 * @returns {Command[]}
 */
export function buildCommands(user, currentTheme) {
	/** @returns {Command} A "Go to" command. */
	const link = (id, labelKey, icon, href, keywords) => ({
		id,
		group: 'goto',
		labelKey,
		icon,
		href,
		keywords
	})

	const base = user ? `/user/${user.userId}` : ''
	const goto = user
		? [
				link('myRecipes', 'nav.myRecipes', 'List', `${base}/recipes`, ['cookbook', 'list']),
				link('allRecipes', 'nav.allRecipes', 'FoodBowl', '/recipes', ['everyone', 'public']),
				link('newRecipe', 'nav.newRecipe', 'New', '/recipe/new', ['add', 'create', 'scrape']),
				link('shopping', 'nav.shoppingList', 'Shopping', `${base}/shopping`, ['groceries']),
				link('calendar', 'nav.calendar', 'Calendar', `${base}/calendar`, ['cooked', 'log']),
				link('import', 'palette.import', 'Export', `${base}/options/import`, ['paprika']),
				link('settings', 'nav.settings', 'Settings', `${base}/options/settings`, ['account']),
				...(user.isAdmin
					? [
							link('site', 'palette.siteSettings', 'Settings', `${base}/options/admin/site`, [
								'ai'
							]),
							link('users', 'palette.users', 'Users', `${base}/options/admin/users`, ['admin'])
						]
					: [])
			]
		: [
				link('allRecipes', 'nav.allRecipes', 'FoodBowl', '/recipes', ['everyone', 'public']),
				link('login', 'nav.login', 'User', '/login', ['sign in'])
			]

	const themeLabels = {
		[THEME_LIGHT]: 'nav.themeLight',
		[THEME_DARK]: 'nav.themeDark',
		[THEME_AUTO]: 'nav.themeAuto'
	}
	/** @type {Command[]} */
	const themes = themePreferences
		.filter((theme) => theme !== currentTheme)
		.map((theme) => ({
			id: `theme-${theme}`,
			group: 'actions',
			labelKey: 'palette.switchTheme',
			labelVars: { theme: themeLabels[theme] },
			icon: 'Theme',
			theme,
			keywords: ['theme', 'dark', 'light', 'mode']
		}))

	return [...goto, ...themes]
}

/**
 * Commands whose label or keywords contain every word of the query.
 *
 * @param {Command[]} commands
 * @param {string} query
 * @param {(command: Command) => string} label - Resolves a command's translated label
 * @returns {Command[]}
 */
export function filterCommands(commands, query, label) {
	const words = query.toLowerCase().split(/\s+/).filter(Boolean)
	if (!words.length) return commands
	return commands.filter((command) => {
		const haystack = [label(command), ...(command.keywords || [])].join(' ').toLowerCase()
		return words.every((word) => haystack.includes(word))
	})
}

/**
 * If the query is a web address, the URL to import a recipe from.
 *
 * @param {string} query
 * @returns {URL | null}
 */
export function importUrlFrom(query) {
	const text = query.trim()
	if (!/^https?:\/\/\S+$/i.test(text)) return null
	try {
		return new URL(text)
	} catch {
		return null
	}
}
