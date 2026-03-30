import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
	buildCompatibilityManifest,
	createCompatibilityEntry,
	mergeCompatibilityResults,
	renderCompatibilityMarkdown
} from '$lib/utils/parse/compatibility/index.js'
import {
	addUrlAndPersist,
	resolveCompatibilityLLMConfig,
	runCompatibilitySweep
} from '$lib/utils/parse/compatibility/runner.js'

const tempDirectories = []

afterEach(() => {
	vi.restoreAllMocks()
	for (const directory of tempDirectories.splice(0)) {
		fs.rmSync(directory, { recursive: true, force: true })
	}
})

describe('scrape compatibility manifest', () => {
	it('maps URLs to expected fixture filenames and stable status classes', () => {
		const entry = createCompatibilityEntry(
			'https://www.allrecipes.com/recipe/239541/chef-johns-fresh-salmon-cakes/',
			'known_blocked'
		)

		expect(entry.site).toBe('allrecipes.com')
		expect(entry.expected_fixture_filename).toBe(
			'allrecipes_com_recipe_239541_chef_johns_fresh_salmon_cakes_.html'
		)
		expect(entry.status_class).toBe('known_blocked')
		expect(entry.has_site_config).toBe(true)
	})

	it('builds a sorted manifest with first-match precedence from legacy lists', () => {
		const manifest = buildCompatibilityManifest({
			activeUrls: ['https://zeta.example/recipe'],
			blockedUrls: ['https://alpha.example/blocked'],
			unscrapableUrls: ['https://beta.example/nope'],
			legacyUrls: ['https://zeta.example/recipe', 'https://gamma.example/legacy']
		})

		expect(manifest.map((entry) => [entry.site, entry.status_class])).toEqual([
			['alpha.example', 'known_blocked'],
			['beta.example', 'known_unscrapable'],
			['gamma.example', 'legacy_reference'],
			['zeta.example', 'active']
		])
	})
})

describe('scrape compatibility report', () => {
	it('renders Markdown rows sorted by site and URL', () => {
		const markdown = renderCompatibilityMarkdown({
			generatedAt: '2026-03-30T10:00:00.000Z',
			llmEnabled: false,
			urlCount: 2,
			results: [
				{
					site: 'zeta.example',
					url: 'https://zeta.example/recipe',
					testedAt: '2026-03-30T09:00:00.000Z',
					fixtureFilename: 'zeta.html',
					hasSiteConfig: false,
					diagnosis: 'parser ok',
					liveFetch: { attempted: true, ok: true, status: 200, statusText: 'OK', htmlCaptured: true },
					vanillaScrape: { status: 'complete' },
					llmFallback: { status: 'skipped' },
					notes: 'Later row'
				},
				{
					site: 'alpha.example',
					url: 'https://alpha.example/recipe',
					testedAt: '2026-03-30T08:00:00.000Z',
					fixtureFilename: 'alpha.html',
					hasSiteConfig: false,
					diagnosis: 'live blocked, html captured',
					liveFetch: {
						attempted: true,
						ok: false,
						status: 402,
						statusText: 'Payment Required',
						htmlCaptured: true
					},
					vanillaScrape: { status: 'partial' },
					llmFallback: { status: 'complete' },
					notes: 'Earlier row'
				}
			]
		})

		const alphaIndex = markdown.indexOf('| alpha.example |')
		const zetaIndex = markdown.indexOf('| zeta.example |')

		expect(alphaIndex).toBeGreaterThan(-1)
		expect(zetaIndex).toBeGreaterThan(alphaIndex)
		expect(markdown).toContain('| alpha.example | [alpha.example](https://alpha.example/recipe) |')
		expect(markdown).toContain('| zeta.example | [zeta.example](https://zeta.example/recipe) |')
		expect(markdown).toContain(
			'| alpha.example | [alpha.example](https://alpha.example/recipe) | 2026-03-30T08:00:00.000Z | blocked | 402 Payment Required | yes | no | live blocked, html captured | no |  |  |  | partial | complete | alpha.html | Earlier row |'
		)
	})
})

describe('scrape compatibility sweep', () => {
	it('skips the LLM stage when it is disabled', async () => {
		const readFixture = vi.fn().mockReturnValue('<html><body>recipe</body></html>')
		const parseHtml = vi.fn().mockResolvedValue({
			name: 'Recipe',
			ingredients: ['1 egg'],
			instructions: ['Cook']
		})
		const llmExtractor = vi.fn()

		const payload = await runCompatibilitySweep({
			manifest: [
				createCompatibilityEntry('https://example.com/recipe', 'active', 'Fixture-backed example')
			],
			options: { enableLLM: false, statusClass: 'active', fixtureDirectory: 'unused' },
			fetcher: vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				statusText: 'OK',
				contentType: 'text/html',
				html: '<html><body>recipe</body></html>',
				finalUrl: 'https://example.com/recipe'
			}),
			parseHtml,
			readFixture,
			llmExtractor
		})

		expect(payload.urlCount).toBe(1)
		expect(payload.results[0].vanillaScrape.status).toBe('complete')
		expect(payload.results[0].llmFallback.status).toBe('skipped')
		expect(llmExtractor).not.toHaveBeenCalled()
	})

	it('runs the LLM stage when enabled and vanilla scraping is incomplete', async () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compatibility-'))
		tempDirectories.push(tempDir)

		const fixtureHtml = '<html><body>blocked page with recipe text</body></html>'
		const payload = await runCompatibilitySweep({
			manifest: [
				createCompatibilityEntry('https://blocked.example/recipe', 'active', 'Blocked live fetch')
			],
			options: {
				enableLLM: true,
				statusClass: 'active',
				refreshFixtures: true,
				fixtureDirectory: tempDir
			},
			env: { OPENAI_API_KEY: 'test-key' },
			fetcher: vi.fn().mockResolvedValue({
				ok: false,
				status: 402,
				statusText: 'Payment Required',
				contentType: 'text/html',
				html: fixtureHtml,
				finalUrl: 'https://blocked.example/recipe'
			}),
			parseHtml: vi.fn().mockResolvedValue({
				name: 'Blocked Recipe',
				ingredients: [],
				instructions: ['Only one step']
			}),
			llmExtractor: vi.fn().mockResolvedValue({
				name: 'Recovered Recipe',
				ingredients: ['1 egg'],
				instructions: ['Cook it']
			})
		})

		expect(payload.llmEnabled).toBe(true)
		expect(payload.results[0].liveFetch.status).toBe(402)
		expect(payload.results[0].liveFetch.htmlCaptured).toBe(true)
		expect(payload.results[0].vanillaScrape.status).toBe('partial')
		expect(payload.results[0].llmFallback.status).toBe('complete')
		expect(payload.results[0].llmFallback.provider).toBe('openai')
		expect(payload.results[0].diagnosis).toBe('live blocked, html captured')
		expect(fs.readdirSync(tempDir).length).toBe(1)
	})

	it('supports only-failed mode using previous results', async () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compatibility-results-'))
		tempDirectories.push(tempDir)
		const resultsPath = path.join(tempDir, 'latest.json')
		fs.writeFileSync(
			resultsPath,
			JSON.stringify({
				generatedAt: '2026-03-30T09:00:00.000Z',
				runnerVersion: 1,
				llmEnabled: false,
				urlCount: 2,
				results: [
					{
						url: 'https://example.com/complete',
						liveFetch: { ok: true, status: 200 },
						vanillaScrape: { status: 'complete' }
					},
					{
						url: 'https://example.com/failed',
						liveFetch: { ok: false, status: 403 },
						vanillaScrape: { status: 'failed' }
					}
				]
			})
		)

		const fetcher = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			statusText: 'OK',
			contentType: 'text/html',
			html: '<html><body>recipe</body></html>',
			finalUrl: 'https://example.com/failed'
		})

		const payload = await runCompatibilitySweep({
			manifest: [
				createCompatibilityEntry('https://example.com/complete', 'active'),
				createCompatibilityEntry('https://example.com/failed', 'active')
			],
			options: {
				enableLLM: false,
				statusClass: 'all',
				onlyFailed: true,
				resultsPath
			},
			fetcher,
			parseHtml: vi.fn().mockResolvedValue({
				name: 'Recovered',
				ingredients: ['1 egg'],
				instructions: ['Cook']
			}),
			readFixture: vi.fn().mockReturnValue('<html><body>recipe</body></html>')
		})

		expect(payload.urlCount).toBe(1)
		expect(payload.results[0].url).toBe('https://example.com/failed')
		expect(fetcher).toHaveBeenCalledTimes(1)
	})
})

describe('compatibility LLM config resolution', () => {
	it('returns null when LLM fallback is disabled', () => {
		expect(resolveCompatibilityLLMConfig(false, { OPENAI_API_KEY: 'test-key' })).toBeNull()
	})

	it('prefers configured text provider defaults when enabled', () => {
		expect(
			resolveCompatibilityLLMConfig(true, {
				OPENAI_API_KEY: 'test-key',
				LLM_TEXT_PROVIDER: 'openai'
			})
		).toEqual({
			provider: 'openai',
			model: 'gpt-4o-mini'
		})
	})
})

describe('compatibility result merging and manifest append', () => {
	it('merges single-url reruns into an existing results payload', () => {
		const merged = mergeCompatibilityResults(
			{
				generatedAt: '2026-03-30T09:00:00.000Z',
				runnerVersion: 1,
				llmEnabled: false,
				urlCount: 2,
				results: [
					{ site: 'a.example', url: 'https://a.example/recipe', vanillaScrape: { status: 'complete' } },
					{ site: 'b.example', url: 'https://b.example/recipe', vanillaScrape: { status: 'failed' } }
				]
			},
			{
				generatedAt: '2026-03-30T10:00:00.000Z',
				runnerVersion: 1,
				llmEnabled: true,
				urlCount: 1,
				results: [
					{ site: 'b.example', url: 'https://b.example/recipe', vanillaScrape: { status: 'complete' } }
				]
			}
		)

		expect(merged.generatedAt).toBe('2026-03-30T10:00:00.000Z')
		expect(merged.urlCount).toBe(2)
		expect(
			merged.results.find((result) => result.url === 'https://b.example/recipe').vanillaScrape.status
		).toBe('complete')
	})

	it('adds a single URL to the manifest without manual copy-paste', () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compatibility-manifest-'))
		tempDirectories.push(tempDir)
		const manifestPath = path.join(tempDir, 'manifest.json')
		fs.writeFileSync(manifestPath, '[]')

		const entry = addUrlAndPersist({
			url: 'https://example.com/new-recipe',
			statusClass: 'active',
			notes: 'New manual candidate',
			manifestPath
		})

		const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
		expect(entry.url).toBe('https://example.com/new-recipe')
		expect(manifest).toHaveLength(1)
		expect(manifest[0].status_class).toBe('active')
		expect(manifest[0].notes).toBe('New manual candidate')
	})
})
