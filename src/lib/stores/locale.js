/**
 * Locale store for Vanilla Cookbook.
 *
 * - `langStore`  writable store for the current language code (e.g. 'eng')
 * - `t`          derived store returning a bound translation function: $t('key', { vars })
 * - `isRtl`      derived boolean — true when current language is right-to-left
 *
 * Initialise from layout:
 *   import { langStore } from '$lib/stores/locale.js'
 *   langStore.set(data.lang)  // set once in +layout.svelte $effect
 *
 * Use in components:
 *   import { t } from '$lib/stores/locale.js'
 *   <Button>{$t('common.save')}</Button>
 *   <Button>{$t('recipe.cookedTimes_one', { count: 1 })}</Button>
 *
 * Use in script blocks (non-reactive, one-shot):
 *   import { t as tFn } from '$lib/i18n/index.js'
 *   feedbackMessage = tFn('settings.msg.accountUpdated', get(langStore))
 */

import { writable, derived } from 'svelte/store'
import { t as tFn } from '$lib/i18n/index.js'

const RTL_LANGS = new Set(['ara'])

/** Current language code, matches AuthUser.language (default 'eng'). */
export const langStore = writable('eng')

/**
 * Bound translation function.
 * Call as: $t('key') or $t('key', { count: 3 })
 * @type {import('svelte/store').Readable<(key: string, vars?: Record<string, string|number>) => string>}
 */
export const t = derived(langStore, ($lang) => (key, vars = {}) => tFn(key, $lang, vars))

/**
 * True when the current language renders right-to-left (Arabic).
 * Use to set dir="rtl" on the document root.
 * @type {import('svelte/store').Readable<boolean>}
 */
export const isRtl = derived(langStore, ($lang) => RTL_LANGS.has($lang))
