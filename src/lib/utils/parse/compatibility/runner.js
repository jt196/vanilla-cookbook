import fs from 'fs'
import path from 'path'
import { getDefaultModelsForProvider } from '$lib/utils/llmModels'
import {
	COMPATIBILITY_DEFAULTS,
	classifyCompatibilityResult,
	createCompatibilityEntry,
	loadCompatibilityManifest,
	mergeCompatibilityManifestEntries,
	mergeCompatibilityResults,
	readFixtureHtml,
	renderCompatibilityMarkdown,
	saveCompatibilityJson,
	summarizeLLMResult,
	summarizeLiveFetch,
	summarizeRecipeResult,
	writeFixtureHtml
} from './index.js'

export function parseRunnerArgs(argv) {
	const parsed = {}
	for (let i = 0; i < argv.length; i += 1) {
		const token = argv[i]
		if (token === '--') continue
		if (!token.startsWith('--')) continue
		const key = token.slice(2)
		const next = argv[i + 1]
		if (!next || next.startsWith('--')) {
			parsed[key] = true
		} else {
			parsed[key] = next
			i += 1
		}
	}
	return parsed
}

export function getRunnerOptions(args = {}) {
	return {
		manifestPath: args.manifest || COMPATIBILITY_DEFAULTS.manifestPath,
		resultsPath: args.results || COMPATIBILITY_DEFAULTS.resultsPath,
		reportPath: args.report || COMPATIBILITY_DEFAULTS.reportPath,
		fixtureDirectory: args['fixture-dir'] || COMPATIBILITY_DEFAULTS.fixtureDirectory,
		refreshFixtures: Boolean(args['refresh-fixtures']),
		enableLLM: Boolean(args.llm),
		limit: args.limit ? Number(args.limit) : null,
		statusClass: args.status || 'active',
		bootstrapManifest: Boolean(args['bootstrap-manifest']),
		onlyFailed: Boolean(args['only-failed']),
		url: args.url || null,
		addUrl: Boolean(args['add-url']),
		statusClassForUrl: args['status-class'] || 'active',
		notes: args.notes || ''
	}
}

export function bootstrapCompatibilityManifest({
	manifestPath = COMPATIBILITY_DEFAULTS.manifestPath
}) {
	const manifest = loadCompatibilityManifest(manifestPath)
	saveCompatibilityJson(manifestPath, manifest)
	return manifest
}

export function addUrlAndPersist({
	url,
	statusClass = 'active',
	notes = 'Added manually.',
	manifestPath = COMPATIBILITY_DEFAULTS.manifestPath
}) {
	if (!url) throw new Error('Missing --url value')
	const manifest = loadCompatibilityManifest(manifestPath)
	const nextManifest = mergeCompatibilityManifestEntries(manifest, {
		...createCompatibilityEntry(url, statusClass, notes || 'Added manually.')
	})
	saveCompatibilityJson(manifestPath, nextManifest)
	return nextManifest.find((entry) => entry.url === url)
}

export async function runLiveFetch(url, fetcher = null) {
	const effectiveFetcher = fetcher || (await loadRecipeParseModule()).fetchHTMLResponse
	try {
		const response = await effectiveFetcher(url)
		return {
			attempted: true,
			ok: response.ok,
			status: response.status,
			statusText: response.statusText,
			contentType: response.contentType,
			htmlCaptured: Boolean(response.html),
			html: response.html,
			finalUrl: response.finalUrl,
			error: response.ok ? null : `HTTP ${response.status} ${response.statusText}`.trim()
		}
	} catch (error) {
		return {
			attempted: true,
			ok: false,
			status: null,
			statusText: '',
			contentType: '',
			htmlCaptured: false,
			html: '',
			finalUrl: null,
			error: error instanceof Error ? error.message : String(error)
		}
	}
}

export function resolveCompatibilityLLMConfig(enableLLM, env = process.env) {
	if (!enableLLM) return null

	const provider =
		env.LLM_TEXT_PROVIDER ||
		env.LLM_PROVIDER ||
		(env.OPENAI_API_KEY
			? 'openai'
			: env.ANTHROPIC_API_KEY
				? 'anthropic'
				: env.GOOGLE_API_KEY
					? 'google'
					: env.OLLAMA_BASE_URL
						? 'ollama'
						: null)

	if (!provider) return null

	return {
		provider,
		model:
			env.LLM_TEXT_MODEL ||
			env.LLM_API_ENGINE_TEXT ||
			getDefaultModelsForProvider(provider)?.text ||
			null
	}
}

export async function runCompatibilitySweep({
	manifest,
	options = {},
	env = process.env,
	fetcher = null,
	parseHtml = null,
	readFixture = readFixtureHtml,
	writeFixture = writeFixtureHtml,
	llmExtractor = null
}) {
	const recipeParseModule = fetcher || parseHtml ? null : await loadRecipeParseModule()
	const effectiveParseHtml = parseHtml || recipeParseModule.parseHTML
	const llmConfig = resolveCompatibilityLLMConfig(options.enableLLM, env)
	const effectiveLlmExtractor =
		llmConfig &&
		(llmExtractor || (await loadCompatibilityLLMModule()).extractRecipeWithCompatibilityLLM)
	const previousResults =
		options.onlyFailed && fs.existsSync(path.resolve(process.cwd(), options.resultsPath || COMPATIBILITY_DEFAULTS.resultsPath))
			? JSON.parse(
					fs.readFileSync(
						path.resolve(process.cwd(), options.resultsPath || COMPATIBILITY_DEFAULTS.resultsPath),
						'utf8'
					)
				)
			: null
	const previousFailed = new Set(
		(previousResults?.results || [])
			.filter(
				(result) =>
					result.vanillaScrape?.status !== 'complete' ||
					(typeof result.liveFetch?.status === 'number' && !result.liveFetch?.ok)
			)
			.map((result) => result.url)
	)
	const selectedEntries = manifest
		.filter((entry) => !options.url || entry.url === options.url)
		.filter((entry) => options.statusClass === 'all' || entry.status_class === options.statusClass)
		.filter((entry) => !options.onlyFailed || previousFailed.has(entry.url))
		.slice(0, options.limit ?? manifest.length)

	const results = []

	for (const entry of selectedEntries) {
		const testedAt = new Date().toISOString()
		const liveFetch = await runLiveFetch(entry.url, fetcher)

		if (options.refreshFixtures && liveFetch.htmlCaptured && liveFetch.html) {
			writeFixture(entry, liveFetch.html, options.fixtureDirectory)
		}

		const fixtureHtml = readFixture(entry, options.fixtureDirectory) || liveFetch.html || null
		let parserRecipe = null
		let parserError = null

		if (fixtureHtml) {
			try {
				parserRecipe = await effectiveParseHtml(fixtureHtml, entry.url)
			} catch (error) {
				parserError = error
			}
		}

		const vanillaScrape = fixtureHtml
			? summarizeRecipeResult(parserRecipe, parserError)
			: summarizeRecipeResult(null, 'No fixture or HTML body available.')

		let llmFallback = summarizeLLMResult({
			attempted: false,
			provider: llmConfig?.provider || null,
			model: llmConfig?.model || null,
			error: llmConfig ? null : 'LLM fallback disabled.'
		})

		if (llmConfig && fixtureHtml && liveFetch.htmlCaptured && vanillaScrape.status !== 'complete') {
			try {
				const llmRecipe = await effectiveLlmExtractor({
					provider: llmConfig.provider,
					model: llmConfig.model || undefined,
					content: fixtureHtml,
					url: entry.url,
					env
				})
				llmFallback = summarizeLLMResult({
					attempted: true,
					recipe: llmRecipe,
					provider: llmConfig.provider,
					model: llmConfig.model
				})
			} catch (error) {
				llmFallback = summarizeLLMResult({
					attempted: true,
					provider: llmConfig.provider,
					model: llmConfig.model,
					error
				})
			}
		}

		results.push({
			site: entry.site,
			url: entry.url,
			fixtureFilename: entry.expected_fixture_filename,
			hasSiteConfig: Boolean(entry.has_site_config),
			testedAt,
			liveFetch: summarizeLiveFetch(liveFetch),
			vanillaScrape,
			llmFallback,
			diagnosis: classifyCompatibilityResult({
				liveFetch,
				vanillaScrape,
				llmFallback,
				hasSiteConfig: Boolean(entry.has_site_config)
			}),
			notes: entry.notes || ''
		})
	}

	return {
		generatedAt: new Date().toISOString(),
		runnerVersion: 1,
		llmEnabled: Boolean(llmConfig),
		urlCount: results.length,
		results
	}
}

export function loadSelectedManifest(manifestPath = COMPATIBILITY_DEFAULTS.manifestPath) {
	return loadCompatibilityManifest(manifestPath)
}

export function saveCompatibilityArtifacts(payload, options = {}) {
	const resultsPath = options.resultsPath || COMPATIBILITY_DEFAULTS.resultsPath
	const reportPath = options.reportPath || COMPATIBILITY_DEFAULTS.reportPath
	const existingPayload =
		options.mergeResults !== false && fs.existsSync(path.resolve(process.cwd(), resultsPath))
			? JSON.parse(fs.readFileSync(path.resolve(process.cwd(), resultsPath), 'utf8'))
			: null
	const finalPayload =
		options.mergeResults !== false && existingPayload
			? mergeCompatibilityResults(existingPayload, payload)
			: payload

	saveCompatibilityJson(resultsPath, finalPayload)

	const absoluteReportPath = path.resolve(process.cwd(), reportPath)
	fs.mkdirSync(path.dirname(absoluteReportPath), { recursive: true })
	fs.writeFileSync(absoluteReportPath, renderCompatibilityMarkdown(finalPayload), 'utf8')
	return finalPayload
}

async function loadRecipeParseModule() {
	return import('$lib/utils/parse/recipeParse.js')
}

async function loadCompatibilityLLMModule() {
	return import('./llm.js')
}
