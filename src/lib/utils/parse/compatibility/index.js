import fs from 'fs'
import path from 'path'
import { urlToFilename } from '../parseTesting.js'
import { siteConfigurations } from '../siteConfigurations.js'

export const COMPATIBILITY_STATUS_CLASSES = [
	'active',
	'known_blocked',
	'known_unscrapable',
	'legacy_reference'
]

export const COMPATIBILITY_DEFAULTS = {
	manifestPath: 'src/lib/data/compatibility/scrape-compatibility.manifest.json',
	resultsPath: 'src/lib/data/compatibility/scrape-compatibility.latest.json',
	reportPath: 'docs/technical/scrape-compatibility.md',
	fixtureDirectory: 'src/lib/data/recipe_html'
}

/**
 * @typedef {Object} ManifestEntry - One URL in the compatibility manifest.
 * @property {string} site - Hostname without "www."
 * @property {string} url
 * @property {string} expected_fixture_filename - Saved HTML snapshot name in the fixture dir
 * @property {'active' | 'known_blocked' | 'known_unscrapable' | 'legacy_reference'} status_class
 * @property {boolean} has_site_config - Whether siteConfigurations has CSS selectors for it
 * @property {string} [notes]
 */

/**
 * @typedef {Object} CompatibilityPayload - Results of a compatibility sweep.
 * @property {string} generatedAt - ISO timestamp
 * @property {number} runnerVersion
 * @property {boolean} llmEnabled
 * @property {number} urlCount
 * @property {Array<object>} results - One result per URL (live fetch, scrape, LLM, diagnosis)
 */

/**
 * The site name for a URL: its hostname without "www.".
 *
 * @param {string} url
 * @returns {string} The site, or the input unchanged if it isn't a valid URL.
 */
export function getSiteName(url) {
	try {
		return new URL(url).hostname.replace(/^www\./, '')
	} catch {
		return url
	}
}

/**
 * Create a manifest entry for a URL, with its fixture filename and site-config flag.
 *
 * @param {string} url
 * @param {ManifestEntry['status_class']} [statusClass='legacy_reference']
 * @param {string} [notes='']
 * @returns {ManifestEntry}
 */
export function createCompatibilityEntry(url, statusClass = 'legacy_reference', notes = '') {
	const site = getSiteName(url)
	return {
		site,
		url,
		expected_fixture_filename: urlToFilename(url),
		status_class: statusClass,
		has_site_config: Boolean(siteConfigurations[site]),
		notes
	}
}

/**
 * Sort manifest entries (or results) by site, then URL.
 *
 * @template {{ site: string, url: string }} T
 * @param {T[]} [entries=[]]
 * @returns {T[]} A sorted copy.
 */
export function sortCompatibilityEntries(entries = []) {
	return [...entries].sort((a, b) => {
		const siteCompare = a.site.localeCompare(b.site)
		return siteCompare !== 0 ? siteCompare : a.url.localeCompare(b.url)
	})
}

/**
 * Build a manifest from lists of URLs grouped by status. A URL listed more than once keeps
 * the first status in the order: active, blocked, unscrapable, legacy.
 *
 * @param {{ activeUrls?: string[], legacyUrls?: string[], blockedUrls?: string[],
 *   unscrapableUrls?: string[] }} lists
 * @returns {ManifestEntry[]} Sorted entries.
 */
export function buildCompatibilityManifest({
	activeUrls = [],
	legacyUrls = [],
	blockedUrls = [],
	unscrapableUrls = []
}) {
	const entries = new Map()

	const addUrls = (urls, statusClass, notes) => {
		for (const url of urls) {
			if (!url || entries.has(url)) continue
			entries.set(url, createCompatibilityEntry(url, statusClass, notes))
		}
	}

	addUrls(activeUrls, 'active', 'Active regression URL.')
	addUrls(blockedUrls, 'known_blocked', 'Imported from legacy siteErrors list.')
	addUrls(unscrapableUrls, 'known_unscrapable', 'Imported from legacy sitesCantFix list.')
	addUrls(legacyUrls, 'legacy_reference', 'Imported from legacy sitePasses list.')

	return sortCompatibilityEntries([...entries.values()])
}

/**
 * Read the manifest JSON, filling in `has_site_config` where it's missing.
 *
 * @param {string} [manifestPath] - Relative to the working directory.
 * @returns {ManifestEntry[]}
 */
export function loadCompatibilityManifest(manifestPath = COMPATIBILITY_DEFAULTS.manifestPath) {
	const entries = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), manifestPath), 'utf8'))
	return entries.map((entry) => ({
		...entry,
		has_site_config:
			typeof entry.has_site_config === 'boolean'
				? entry.has_site_config
				: Boolean(siteConfigurations[entry.site || getSiteName(entry.url)])
	}))
}

/**
 * Merge entries into a manifest by URL; later entries override fields of earlier ones.
 *
 * @param {ManifestEntry[]} [existingEntries=[]]
 * @param {...(Partial<ManifestEntry> | Partial<ManifestEntry>[])} nextEntries
 * @returns {ManifestEntry[]} Sorted, merged entries.
 */
export function mergeCompatibilityManifestEntries(existingEntries = [], ...nextEntries) {
	const entries = new Map(existingEntries.map((entry) => [entry.url, entry]))
	for (const entry of nextEntries.flat().filter(Boolean)) {
		const site = entry.site || getSiteName(entry.url)
		entries.set(entry.url, {
			...entries.get(entry.url),
			...entry,
			site,
			has_site_config:
				typeof entry.has_site_config === 'boolean'
					? entry.has_site_config
					: Boolean(siteConfigurations[site])
		})
	}
	return sortCompatibilityEntries([...entries.values()])
}

/**
 * Write data as pretty-printed JSON, creating the directory if needed.
 *
 * @param {string} filePath - Relative to the working directory.
 * @param {unknown} data
 */
export function saveCompatibilityJson(filePath, data) {
	const absolutePath = path.resolve(process.cwd(), filePath)
	fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
	fs.writeFileSync(absolutePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

/**
 * Normalise the result of fetching a URL live, for the results file.
 *
 * @param {{ attempted?: boolean, ok?: boolean, status?: number | null, statusText?: string,
 *   contentType?: string, htmlCaptured?: boolean, error?: string | null,
 *   finalUrl?: string | null }} [result]
 * @returns {object} The same fields with defaults filled in.
 */
export function summarizeLiveFetch({
	attempted = false,
	ok = false,
	status = null,
	statusText = '',
	contentType = '',
	htmlCaptured = false,
	error = null,
	finalUrl = null
} = {}) {
	return {
		attempted,
		ok,
		status,
		statusText,
		contentType,
		htmlCaptured,
		finalUrl,
		error
	}
}

/**
 * Summarise a parsed recipe as complete (name and ingredients), partial (some fields) or
 * failed, with field counts.
 *
 * @param {object | string | null} recipe - Parser output; a string is a parser error message.
 * @param {Error | string | null} [error=null]
 * @returns {{ attempted: true, ok: boolean, status: 'complete' | 'partial' | 'failed',
 *   hasName: boolean, ingredientCount: number, instructionCount: number,
 *   instructionChars: number, error: string | null }}
 */
export function summarizeRecipeResult(recipe, error = null) {
	const isRecipeObject = Boolean(recipe && typeof recipe === 'object' && !Array.isArray(recipe))
	const hasName = Boolean(recipe?.name)
	const ingredientCount = Array.isArray(recipe?.ingredients) ? recipe.ingredients.length : 0
	const instructionCount = Array.isArray(recipe?.instructions) ? recipe.instructions.length : 0
	const instructionChars = Array.isArray(recipe?.instructions)
		? recipe.instructions.join(' ').trim().length
		: 0

	let status = 'failed'
	if (isRecipeObject && hasName && ingredientCount > 0) {
		status = 'complete'
	} else if (isRecipeObject && (hasName || ingredientCount > 0 || instructionCount > 0)) {
		status = 'partial'
	}

	return {
		attempted: true,
		ok: status !== 'failed',
		status,
		hasName,
		ingredientCount,
		instructionCount,
		instructionChars,
		error:
			typeof error === 'string'
				? error
				: error?.message || (typeof recipe === 'string' ? recipe : null)
	}
}

/**
 * Summarise the AI fallback's result like `summarizeRecipeResult`, or as skipped.
 *
 * @param {{ attempted?: boolean, recipe?: object | null, provider?: string | null,
 *   model?: string | null, error?: string | null }} [result]
 * @returns {{ attempted: boolean, ok: boolean, status: string, provider: string | null,
 *   model: string | null, error: string | null }}
 */
export function summarizeLLMResult({
	attempted = false,
	recipe = null,
	provider = null,
	model = null,
	error = null
} = {}) {
	if (!attempted) {
		return {
			attempted: false,
			ok: false,
			status: 'skipped',
			provider,
			model,
			error
		}
	}

	const summary = summarizeRecipeResult(recipe, error)
	return {
		attempted: true,
		ok: summary.ok,
		status: summary.status,
		provider,
		model,
		error: summary.error
	}
}

/**
 * A short diagnosis for a URL from its fetch, scrape and AI results, e.g. "parser ok",
 * "upstream blocked" or "parser gap, site config candidate".
 *
 * @param {{ liveFetch?: object, vanillaScrape?: object, llmFallback?: object,
 *   hasSiteConfig?: boolean }} [results]
 * @returns {string}
 */
export function classifyCompatibilityResult({
	liveFetch = {},
	vanillaScrape = {},
	llmFallback = {},
	hasSiteConfig = false
} = {}) {
	if (vanillaScrape.status === 'complete') {
		return liveFetch?.attempted && !liveFetch.ok
			? 'live fetch failed, fixture parser ok'
			: 'parser ok'
	}

	if (vanillaScrape.error) {
		return vanillaScrape.error === 'Missing data'
			? hasSiteConfig
				? 'parser gap despite site config'
				: 'parser gap, site config candidate'
			: 'parser exception'
	}

	if (typeof liveFetch.status === 'number' && !liveFetch.ok) {
		return liveFetch.htmlCaptured ? 'live blocked, html captured' : 'upstream blocked'
	}

	if (llmFallback?.status === 'complete' || llmFallback?.status === 'partial') {
		return 'llm fallback recovery candidate'
	}

	if (vanillaScrape.status === 'partial') {
		return hasSiteConfig ? 'partial scrape, parser tuning needed' : 'partial scrape'
	}

	return 'needs investigation'
}

/**
 * Absolute path of an entry's saved HTML fixture.
 *
 * @param {ManifestEntry} entry
 * @param {string} [fixtureDirectory]
 * @returns {string}
 */
export function getFixturePath(entry, fixtureDirectory = COMPATIBILITY_DEFAULTS.fixtureDirectory) {
	return path.resolve(process.cwd(), fixtureDirectory, entry.expected_fixture_filename)
}

/**
 * Save an entry's HTML fixture (does nothing for empty HTML).
 *
 * @param {ManifestEntry} entry
 * @param {string} html
 * @param {string} [fixtureDirectory]
 */
export function writeFixtureHtml(
	entry,
	html,
	fixtureDirectory = COMPATIBILITY_DEFAULTS.fixtureDirectory
) {
	if (!html) return
	const filePath = getFixturePath(entry, fixtureDirectory)
	fs.mkdirSync(path.dirname(filePath), { recursive: true })
	fs.writeFileSync(filePath, html, 'utf8')
}

/**
 * Read an entry's saved HTML fixture.
 *
 * @param {ManifestEntry} entry
 * @param {string} [fixtureDirectory]
 * @returns {string | null} The HTML, or null if no fixture is saved.
 */
export function readFixtureHtml(entry, fixtureDirectory = COMPATIBILITY_DEFAULTS.fixtureDirectory) {
	const filePath = getFixturePath(entry, fixtureDirectory)
	if (!fs.existsSync(filePath)) return null
	return fs.readFileSync(filePath, 'utf8')
}

/**
 * Render sweep results as the Markdown table in docs/technical/scrape-compatibility.md.
 *
 * @param {CompatibilityPayload} resultsPayload
 * @returns {string}
 */
export function renderCompatibilityMarkdown(resultsPayload) {
	const { generatedAt, llmEnabled, urlCount, results = [] } = resultsPayload
	const header = [
		'<!-- markdownlint-disable MD059 MD060 -->',
		'',
		'# Scrape Compatibility',
		'',
		'Auto-generated by the scrape compatibility workflow.',
		'',
		`- Generated: ${generatedAt || 'not run yet'}`,
		`- LLM enabled: ${llmEnabled ? 'yes' : 'no'}`,
		`- URL count: ${urlCount ?? 0}`,
		''
	]

	if (!results.length) {
		header.push('No compatibility sweep results have been generated yet.')
		return `${header.join('\n')}\n`
	}

	const lines = [
		...header,
		'| Site | URL tested | Last tested | Live fetch | HTTP | HTML captured | Site config | Diagnosis | Name | Ingredients | Instructions | Instruction chars | Vanilla scrape | LLM fallback | Fixture | Notes |',
		'| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
	]

	const sortedResults = [...results].sort((a, b) => {
		const siteCompare = a.site.localeCompare(b.site)
		return siteCompare !== 0 ? siteCompare : a.url.localeCompare(b.url)
	})

	for (const result of sortedResults) {
		lines.push(
			[
				escapeMarkdownCell(result.site),
				`[${escapeMarkdownLinkText(result.site)}](${result.url})`,
				escapeMarkdownCell(result.testedAt || ''),
				escapeMarkdownCell(formatLiveFetchStatus(result.liveFetch)),
				escapeMarkdownCell(formatHttpStatus(result.liveFetch)),
				escapeMarkdownCell(result.liveFetch?.htmlCaptured ? 'yes' : 'no'),
				escapeMarkdownCell(result.hasSiteConfig ? 'yes' : 'no'),
				escapeMarkdownCell(result.diagnosis || ''),
				escapeMarkdownCell(result.vanillaScrape?.hasName ? 'yes' : 'no'),
				escapeMarkdownCell(result.vanillaScrape?.ingredientCount ?? 0),
				escapeMarkdownCell(result.vanillaScrape?.instructionCount ?? 0),
				escapeMarkdownCell(result.vanillaScrape?.instructionChars ?? 0),
				escapeMarkdownCell(result.vanillaScrape?.status || 'failed'),
				escapeMarkdownCell(result.llmFallback?.status || 'skipped'),
				escapeMarkdownCell(result.fixtureFilename || ''),
				escapeMarkdownCell(result.notes || '')
			]
				.join(' | ')
				.replace(/^/, '| ')
				.concat(' |')
		)
	}

	return `${lines.join('\n')}\n`
}

/**
 * Merge a new sweep into previous results by URL, so a partial run updates only the URLs
 * it tested.
 *
 * @param {CompatibilityPayload | null} existingPayload
 * @param {CompatibilityPayload} nextPayload
 * @returns {CompatibilityPayload}
 */
export function mergeCompatibilityResults(existingPayload, nextPayload) {
	if (!existingPayload?.results?.length) return nextPayload

	const results = new Map(existingPayload.results.map((result) => [result.url, result]))
	for (const result of nextPayload.results || []) {
		results.set(result.url, result)
	}

	return {
		generatedAt: nextPayload.generatedAt,
		runnerVersion: nextPayload.runnerVersion,
		llmEnabled: nextPayload.llmEnabled,
		urlCount: results.size,
		results: sortCompatibilityEntries([...results.values()])
	}
}

function formatLiveFetchStatus(liveFetch) {
	if (!liveFetch?.attempted) return 'not-run'
	if (liveFetch.ok && liveFetch.finalUrl && liveFetch.finalUrl !== null) return 'ok'
	if (typeof liveFetch.status === 'number' && liveFetch.status >= 300 && liveFetch.status < 400) {
		return 'redirected'
	}
	if (
		typeof liveFetch.status === 'number' &&
		[401, 402, 403, 404, 429].includes(liveFetch.status)
	) {
		return 'blocked'
	}
	return 'failed'
}

function formatHttpStatus(liveFetch) {
	if (!liveFetch?.attempted) return ''
	if (liveFetch?.status) {
		return `${liveFetch.status}${liveFetch.statusText ? ` ${liveFetch.statusText}` : ''}`
	}
	return liveFetch?.error || ''
}

function escapeMarkdownCell(value) {
	return String(value || '')
		.replace(/\|/g, '\\|')
		.replace(/\n/g, ' ')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
}

function escapeMarkdownLinkText(value) {
	return String(value || 'site')
		.replace(/\[/g, '\\[')
		.replace(/\]/g, '\\]')
}
