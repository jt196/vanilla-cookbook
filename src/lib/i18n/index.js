/**
 * Lightweight i18n helper for Vanilla Cookbook UI strings.
 *
 * Usage:
 *   import { t } from '$lib/i18n/index.js'
 *   t('common.save', 'deu')            // → 'Speichern'
 *   t('recipe.cookedTimes_one', 'eng', { count: 1 }) // → 'Cooked 1 time'
 *
 * Plural convention: use `key_one` / `key_other` suffixes and pick in the
 * component: count === 1 ? t('key_one', lang, {count}) : t('key_other', lang, {count})
 *
 * Falls back to English when a key is missing in the target language.
 * Falls back to the raw key string if the key is missing in English too.
 */

import en from './en.js'
import de from './de.js'
import it from './it.js'
import es from './es.js'
import fr from './fr.js'
import pt from './pt.js'
import ru from './ru.js'
import hi from './hi.js'
import id from './id.js'
import ar from './ar.js'
import hu from './hu.js'
import cs from './cs.js'
import nl from './nl.js'

const locales = {
	eng: en,
	deu: de,
	ita: it,
	esp: es,
	fra: fr,
	por: pt,
	rus: ru,
	hin: hi,
	ind: id,
	ara: ar,
	hun: hu,
	ces: cs,
	nld: nl
}

/**
 * Walk a nested object by a dot-separated key path.
 * @param {object} obj
 * @param {string} key  e.g. 'recipe.msg.cooked'
 * @returns {string|undefined}
 */
function getNestedKey(obj, key) {
	return key.split('.').reduce((o, k) => o?.[k], obj)
}

/**
 * Replace {placeholder} tokens in a string with values from vars.
 * @param {string} str
 * @param {Record<string, string|number>} vars
 * @returns {string}
 */
function interpolate(str, vars) {
	if (!vars || Object.keys(vars).length === 0) return str
	return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), str)
}

/**
 * Translate a dot-separated key to the target language.
 * @param {string} key   Dot-path into the translation object, e.g. 'common.save'
 * @param {string} [lang='eng']  Language code matching AuthUser.language
 * @param {Record<string, string|number>} [vars={}]  Interpolation values
 * @returns {string}
 */
export function t(key, lang = 'eng', vars = {}) {
	const locale = locales[lang] ?? locales.eng
	const str = getNestedKey(locale, key) ?? getNestedKey(locales.eng, key) ?? key
	return interpolate(str, vars)
}

/**
 * Map a BCP 47 Accept-Language tag (e.g. 'de-DE', 'fr') to our internal
 * lang code (e.g. 'deu', 'fra').  Returns 'eng' if no match is found.
 * @param {string|null} acceptLanguage  Value of the Accept-Language header
 * @returns {string}
 */
export function langFromAcceptHeader(acceptLanguage) {
	if (!acceptLanguage) return 'eng'

	// BCP 47 → our lang code
	const tagMap = {
		en: 'eng',
		de: 'deu',
		it: 'ita',
		es: 'esp',
		fr: 'fra',
		pt: 'por',
		ru: 'rus',
		hi: 'hin',
		id: 'ind',
		ar: 'ara',
		hu: 'hun',
		cs: 'ces',
		nl: 'nld'
	}

	// Accept-Language: "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7"
	// Take highest-priority tag, strip region, look up.
	const primary = acceptLanguage.split(',')[0].split(';')[0].trim()
	const base = primary.split('-')[0].toLowerCase()
	return tagMap[base] ?? 'eng'
}

/**
 * All supported language codes (mirrors AuthUser.language values).
 */
export const supportedLangs = Object.keys(locales)
