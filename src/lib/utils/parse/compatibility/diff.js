import fs from 'fs'
import path from 'path'
import { parse } from 'node-html-parser'
import {
	COMPATIBILITY_DEFAULTS,
	loadCompatibilityManifest,
	saveCompatibilityJson
} from './index.js'

export const COMPATIBILITY_DIFF_DEFAULTS = {
	outputPath: 'src/lib/data/compatibility/recipe-scrapers.diff.json',
	source: 'recipe-scrapers',
	sourceUrl: 'https://docs.recipe-scrapers.com/getting-started/supported-sites/'
}

/**
 * Reduce a URL or domain to a bare lowercase domain (no scheme, "www.", path or trailing dot).
 *
 * @param {string} [value='']
 * @returns {string}
 */
export function normalizeRecipeDomain(value = '') {
	return String(value || '')
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\//, '')
		.replace(/^www\./, '')
		.replace(/\/.*$/, '')
		.replace(/\.$/, '')
}

/**
 * Extract the domains listed on recipe-scrapers' "supported sites" page.
 *
 * @param {string} [html='']
 * @returns {string[]} Unique domains, sorted.
 */
export function parseRecipeScrapersSupportedSitesHtml(html = '') {
	if (!html) return []

	const root = parse(html)
	const article = root.querySelector('article') || root.querySelector('main') || root
	const seen = new Set()
	const domains = []

	for (const item of article.querySelectorAll('li')) {
		const text = item.text.trim().replace(/\s+/g, ' ')
		const match = text.match(/\b(?:www\.)?[a-z0-9][a-z0-9.-]*\.[a-z]{2,}\b/i)
		if (!match) continue

		const domain = normalizeRecipeDomain(match[0])
		if (!domain || seen.has(domain)) continue

		seen.add(domain)
		domains.push(domain)
	}

	return domains.sort((a, b) => a.localeCompare(b))
}

/**
 * Fetch and parse recipe-scrapers' "supported sites" page.
 *
 * @param {typeof fetch} [fetcher=fetch]
 * @returns {Promise<string[]>} Unique domains, sorted.
 * @throws {Error} If the page returns an HTTP error.
 */
export async function fetchRecipeScrapersSupportedSites(fetcher = fetch) {
	const response = await fetcher(COMPATIBILITY_DIFF_DEFAULTS.sourceUrl)
	if (!response.ok) {
		throw new Error(
			`Recipe-scrapers source returned HTTP ${response.status} ${response.statusText}`
		)
	}
	const html = await response.text()
	return parseRecipeScrapersSupportedSitesHtml(html)
}

/**
 * Compare recipe-scrapers' supported domains with the manifest and list the ones we don't
 * track yet, as candidates to review.
 *
 * @param {{ upstreamDomains?: string[], manifestEntries?: import('./index.js').ManifestEntry[],
 *   fixtureDirectory?: string, outputPath?: string }} [options]
 * @returns {object} Diff summary with a `candidates` list of untracked domains.
 */
export function buildCompatibilityDiff({
	upstreamDomains = [],
	manifestEntries = [],
	fixtureDirectory = COMPATIBILITY_DEFAULTS.fixtureDirectory,
	outputPath = COMPATIBILITY_DIFF_DEFAULTS.outputPath
} = {}) {
	const manifestBySite = manifestEntries.reduce((map, entry) => {
		const site = normalizeRecipeDomain(entry.site || '')
		if (!site) return map
		const next = map.get(site) || []
		next.push(entry)
		map.set(site, next)
		return map
	}, new Map())

	const candidates = upstreamDomains
		.map((domain) => {
			const existingEntries = manifestBySite.get(domain) || []
			const hasFixture = existingEntries.some((entry) =>
				fs.existsSync(
					path.resolve(process.cwd(), fixtureDirectory, entry.expected_fixture_filename)
				)
			)
			const hasSiteConfig = existingEntries.some((entry) => Boolean(entry.has_site_config))

			return {
				domain,
				source: COMPATIBILITY_DIFF_DEFAULTS.source,
				already_in_manifest: existingEntries.length > 0,
				manifest_status_classes: [...new Set(existingEntries.map((entry) => entry.status_class))],
				has_fixture: hasFixture,
				has_site_config: hasSiteConfig,
				suggested_status: existingEntries.length ? null : 'legacy_reference',
				review_action: existingEntries.length ? 'skip' : 'consider_adding',
				reason: existingEntries.length ? 'already_tracked' : 'new_domain',
				review_notes: existingEntries.length
					? 'Already present in the compatibility manifest.'
					: 'Add as legacy_reference first. Promote to active only after fixture capture and a good parser result.'
			}
		})
		.filter((entry) => !entry.already_in_manifest)
		.sort((a, b) => a.domain.localeCompare(b.domain))

	return {
		generatedAt: new Date().toISOString(),
		source: COMPATIBILITY_DIFF_DEFAULTS.source,
		sourceUrl: COMPATIBILITY_DIFF_DEFAULTS.sourceUrl,
		outputPath,
		upstreamDomainCount: upstreamDomains.length,
		manifestDomainCount: manifestBySite.size,
		newDomainCount: candidates.length,
		candidates
	}
}

/**
 * Fetch recipe-scrapers' supported sites, diff them against the manifest and save the
 * result as JSON.
 *
 * @param {{ fetcher?: typeof fetch, manifestPath?: string, outputPath?: string }} [options]
 * @returns {Promise<object>} The saved diff.
 */
export async function generateCompatibilityDiff({
	fetcher = fetch,
	manifestPath = COMPATIBILITY_DEFAULTS.manifestPath,
	outputPath = COMPATIBILITY_DIFF_DEFAULTS.outputPath
} = {}) {
	const manifestEntries = loadCompatibilityManifest(manifestPath)
	const upstreamDomains = await fetchRecipeScrapersSupportedSites(fetcher)
	const diff = buildCompatibilityDiff({ upstreamDomains, manifestEntries, outputPath })
	saveCompatibilityJson(outputPath, diff)
	return diff
}
