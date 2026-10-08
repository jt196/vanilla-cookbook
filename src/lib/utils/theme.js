/**
 * Theme preferences stored on the user (and in localStorage for visitors).
 * `dracula` is the dark DaisyUI theme; the stored value is kept for existing users.
 */
export const THEME_LIGHT = 'light'
export const THEME_DARK = 'dracula'
export const THEME_AUTO = 'auto'

/** Preferences offered in the UI, in display order. */
export const themePreferences = [THEME_LIGHT, THEME_DARK, THEME_AUTO]

/**
 * Normalise a stored theme preference. Accepts the legacy `dark` value and falls back to
 * `auto` for anything unknown or missing.
 *
 * @param {string | null | undefined} value
 * @returns {'light' | 'dracula' | 'auto'}
 */
export function normalizeThemePreference(value) {
	if (value === THEME_LIGHT) return THEME_LIGHT
	if (value === THEME_DARK || value === 'dark') return THEME_DARK
	return THEME_AUTO
}

/**
 * Resolve a preference to the DaisyUI theme to apply.
 *
 * @param {string | null | undefined} preference
 * @param {boolean} prefersDark - Whether the OS/browser prefers a dark colour scheme
 * @returns {'light' | 'dracula'}
 */
export function resolveTheme(preference, prefersDark) {
	const pref = normalizeThemePreference(preference)
	if (pref === THEME_AUTO) return prefersDark ? THEME_DARK : THEME_LIGHT
	return pref
}

/**
 * Whether a value is an accepted theme preference (including legacy `dark`).
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidThemePreference(value) {
	return typeof value === 'string' && [...themePreferences, 'dark'].includes(value)
}
