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

export function getSiteName(url) {
	try {
		return new URL(url).hostname.replace(/^www\./, '')
	} catch {
		return url
	}
}

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

export function sortCompatibilityEntries(entries = []) {
	return [...entries].sort((a, b) => {
		const siteCompare = a.site.localeCompare(b.site)
		return siteCompare !== 0 ? siteCompare : a.url.localeCompare(b.url)
	})
}

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

export function saveCompatibilityJson(filePath, data) {
	const absolutePath = path.resolve(process.cwd(), filePath)
	fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
	fs.writeFileSync(absolutePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

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

export function classifyCompatibilityResult({
	liveFetch = {},
	vanillaScrape = {},
	llmFallback = {},
	hasSiteConfig = false
} = {}) {
	if (vanillaScrape.status === 'complete') {
		return liveFetch?.attempted && !liveFetch.ok ? 'live fetch failed, fixture parser ok' : 'parser ok'
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

export function getFixturePath(entry, fixtureDirectory = COMPATIBILITY_DEFAULTS.fixtureDirectory) {
	return path.resolve(process.cwd(), fixtureDirectory, entry.expected_fixture_filename)
}

export function writeFixtureHtml(entry, html, fixtureDirectory = COMPATIBILITY_DEFAULTS.fixtureDirectory) {
	if (!html) return
	const filePath = getFixturePath(entry, fixtureDirectory)
	fs.mkdirSync(path.dirname(filePath), { recursive: true })
	fs.writeFileSync(filePath, html, 'utf8')
}

export function readFixtureHtml(entry, fixtureDirectory = COMPATIBILITY_DEFAULTS.fixtureDirectory) {
	const filePath = getFixturePath(entry, fixtureDirectory)
	if (!fs.existsSync(filePath)) return null
	return fs.readFileSync(filePath, 'utf8')
}

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
			].join(' | ')
				.replace(/^/, '| ')
				.concat(' |')
		)
	}

	return `${lines.join('\n')}\n`
}

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
	if (typeof liveFetch.status === 'number' && [401, 402, 403, 404, 429].includes(liveFetch.status)) {
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
