import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import en from '../../src/lib/i18n/en.js'

const ROOT = process.cwd()
const I18N_DIR = path.join(ROOT, 'src/lib/i18n')
const META_FILE = path.join(I18N_DIR, '.translation-meta.json')

const LANGS = {
	deu: { file: 'de.js', englishName: 'German', nativeName: 'Deutsch' },
	ita: { file: 'it.js', englishName: 'Italian', nativeName: 'Italiano' },
	esp: { file: 'es.js', englishName: 'Spanish', nativeName: 'Español' },
	fra: { file: 'fr.js', englishName: 'French', nativeName: 'Français' },
	por: { file: 'pt.js', englishName: 'Portuguese', nativeName: 'Português' },
	rus: { file: 'ru.js', englishName: 'Russian', nativeName: 'Русский' },
	hin: { file: 'hi.js', englishName: 'Hindi', nativeName: 'हिन्दी' },
	ind: { file: 'id.js', englishName: 'Indonesian', nativeName: 'Bahasa Indonesia' },
	ara: { file: 'ar.js', englishName: 'Arabic', nativeName: 'العربية' },
	hun: { file: 'hu.js', englishName: 'Hungarian', nativeName: 'Magyar' },
	ces: { file: 'cs.js', englishName: 'Czech', nativeName: 'Čeština' },
	nld: { file: 'nl.js', englishName: 'Dutch', nativeName: 'Nederlands' }
}

function parseArgs(argv) {
	const opts = {
		provider: 'auto',
		model: null,
		langs: Object.keys(LANGS),
		namespaces: Object.keys(en),
		overwrite: false
	}

	for (const arg of argv) {
		if (arg === '--overwrite') opts.overwrite = true
		else if (arg.startsWith('--provider=')) opts.provider = arg.slice('--provider='.length)
		else if (arg.startsWith('--model=')) opts.model = arg.slice('--model='.length)
		else if (arg.startsWith('--langs=')) {
			opts.langs = arg
				.slice('--langs='.length)
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
		} else if (arg.startsWith('--namespaces=')) {
			opts.namespaces = arg
				.slice('--namespaces='.length)
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
		} else if (arg === '--help' || arg === '-h') {
			opts.help = true
		}
	}

	return opts
}

function usage() {
	return [
		'Usage: node scripts/i18n/generate-locales.mjs [options]',
		'',
		'Options:',
		'  --provider=auto|google|openai  LLM provider to use (default: auto)',
		'  --model=<name>                 Model to use (default: gemini-2.5-flash or gpt-4o)',
		'  --langs=deu,ita,...            Internal language codes to generate',
		'  --namespaces=common,nav        Limit to specific top-level namespaces',
		'  --overwrite                    Regenerate all requested namespaces even if present',
		'  --help                         Show this message',
		'',
		'By default, only missing or stale namespaces are sent for translation.',
		'Staleness is based on the current English namespace hash and target key shape.',
		'',
		'Requires: GOOGLE_API_KEY for Gemini or OPENAI_API_KEY for OpenAI'
	].join('\n')
}

function resolveProvider(opts) {
	if (opts.provider === 'auto') {
		if (process.env.GOOGLE_API_KEY) return 'google'
		if (process.env.OPENAI_API_KEY) return 'openai'
		throw new Error('No supported LLM API key found. Set GOOGLE_API_KEY or OPENAI_API_KEY.')
	}

	if (!['google', 'openai'].includes(opts.provider)) {
		throw new Error(`Unsupported provider: ${opts.provider}`)
	}

	if (opts.provider === 'google' && !process.env.GOOGLE_API_KEY) {
		throw new Error('GOOGLE_API_KEY is not set.')
	}

	if (opts.provider === 'openai' && !process.env.OPENAI_API_KEY) {
		throw new Error('OPENAI_API_KEY is not set.')
	}

	return opts.provider
}

function defaultModelFor(provider) {
	return provider === 'google' ? 'gemini-2.5-flash' : 'gpt-4o'
}

function isObject(value) {
	return value && typeof value === 'object' && !Array.isArray(value)
}

function hashNamespace(value) {
	return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function collectPlaceholders(value, acc = new Set()) {
	if (typeof value === 'string') {
		for (const match of value.matchAll(/\{([a-zA-Z0-9_]+)\}/g)) {
			acc.add(match[1])
		}
		return acc
	}

	if (Array.isArray(value)) {
		for (const item of value) collectPlaceholders(item, acc)
		return acc
	}

	if (isObject(value)) {
		for (const nested of Object.values(value)) collectPlaceholders(nested, acc)
	}

	return acc
}

function compareShape(source, candidate, trail = []) {
	if (typeof source === 'string') {
		if (typeof candidate !== 'string') {
			throw new Error(`Expected string at ${trail.join('.') || '<root>'}`)
		}

		const sourceVars = [...collectPlaceholders(source)].sort().join(',')
		const candidateVars = [...collectPlaceholders(candidate)].sort().join(',')
		if (sourceVars !== candidateVars) {
			throw new Error(
				`Placeholder mismatch at ${trail.join('.') || '<root>'}: expected [${sourceVars}] got [${candidateVars}]`
			)
		}
		return
	}

	if (!isObject(source) || !isObject(candidate)) {
		throw new Error(`Expected object at ${trail.join('.') || '<root>'}`)
	}

	const sourceKeys = Object.keys(source).sort()
	const candidateKeys = Object.keys(candidate).sort()
	if (sourceKeys.join(',') !== candidateKeys.join(',')) {
		throw new Error(
			`Key mismatch at ${trail.join('.') || '<root>'}: expected [${sourceKeys.join(', ')}] got [${candidateKeys.join(', ')}]`
		)
	}

	for (const key of sourceKeys) {
		compareShape(source[key], candidate[key], [...trail, key])
	}
}

function hasCompleteShape(source, candidate) {
	try {
		compareShape(source, candidate)
		return true
	} catch {
		return false
	}
}

function isSameValue(a, b) {
	return JSON.stringify(a) === JSON.stringify(b)
}

function countEnglishLeaves(source, candidate) {
	if (typeof source === 'string' && typeof candidate === 'string') {
		return {
			total: 1,
			matching: source === candidate ? 1 : 0
		}
	}

	if (!isObject(source) || !isObject(candidate)) {
		return {
			total: 0,
			matching: 0
		}
	}

	return Object.keys(source).reduce(
		(acc, key) => {
			const nested = countEnglishLeaves(source[key], candidate[key])
			return {
				total: acc.total + nested.total,
				matching: acc.matching + nested.matching
			}
		},
		{ total: 0, matching: 0 }
	)
}

function isMostlyEnglish(source, candidate) {
	const { total, matching } = countEnglishLeaves(source, candidate)
	if (total < 6) return false
	return matching / total >= 0.35
}

function toModuleSource(obj, langCode) {
	const langMeta = LANGS[langCode]
	const banner = `/**\n * ${langMeta.englishName} UI strings for Vanilla Cookbook.\n * Generated from en.js.\n */\n`
	return `${banner}export default ${JSON.stringify(obj, null, 2)}\n`
}

async function loadExistingLang(langCode) {
	const file = path.join(I18N_DIR, LANGS[langCode].file)
	try {
		const mod = await import(`${file}?t=${Date.now()}`)
		return mod.default
	} catch {
		return {}
	}
}

async function loadMeta() {
	try {
		const raw = await fs.readFile(META_FILE, 'utf8')
		const parsed = JSON.parse(raw)
		return isObject(parsed) ? parsed : {}
	} catch {
		return {}
	}
}

async function saveMeta(meta) {
	await fs.writeFile(META_FILE, `${JSON.stringify(meta, null, 2)}\n`, 'utf8')
}

function ensureMetaShape(meta) {
	if (!isObject(meta.langs)) meta.langs = {}
	return meta
}

function namespaceStatus({ existing, namespace, sourceValue, sourceHash, metaHash, overwrite }) {
	if (overwrite) return 'overwrite'
	if (!(namespace in existing)) return 'missing'
	if (!hasCompleteShape(sourceValue, existing[namespace])) return 'shape-mismatch'
	if (!metaHash) {
		if (isSameValue(sourceValue, existing[namespace])) return 'same-as-english'
		if (isMostlyEnglish(sourceValue, existing[namespace])) return 'mostly-english'
		return 'adopt-existing'
	}
	if (metaHash !== sourceHash) return 'source-updated'
	return 'up-to-date'
}

async function translateWithOpenAI(model, system, user) {
	const OpenAI = (await import('openai')).default
	const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
	const response = await client.chat.completions.create({
		model,
		temperature: 0.2,
		response_format: { type: 'json_object' },
		messages: [
			{ role: 'system', content: system },
			{ role: 'user', content: user }
		]
	})

	return response.choices?.[0]?.message?.content || ''
}

async function translateWithGoogle(model, system, user) {
	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				systemInstruction: {
					parts: [{ text: system }]
				},
				contents: [
					{
						role: 'user',
						parts: [{ text: user }]
					}
				],
				generationConfig: {
					temperature: 0.2,
					responseMimeType: 'application/json'
				}
			})
		}
	)

	const payload = await response.json().catch(() => ({}))
	if (!response.ok) {
		throw new Error(
			payload?.error?.message || `Gemini request failed with status ${response.status}`
		)
	}

	return payload?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

function buildSystemPrompt(langMeta) {
	return [
		'You translate UI copy for a self-hosted recipe app.',
		`Target language: ${langMeta.englishName} (${langMeta.nativeName}).`,
		'Return JSON only.',
		'Preserve the exact object structure and all keys.',
		'Translate values only.',
		'Preserve placeholders like {count}, {name}, {username}, {provider} exactly.',
		'If a source string contains placeholders, the translated string must contain the same placeholders unchanged.',
		'Do not remove, rename, translate, or reorder placeholder tokens.',
		'Preserve markdown, punctuation, emoji absence, and sentence casing when natural.',
		'Do not add comments.',
		'Keep product names and technical tokens unchanged where appropriate.'
	].join(' ')
}

function buildTranslatePrompt(langMeta, namespace, sourceValue) {
	return [
		`Translate this top-level namespace from English to ${langMeta.englishName}.`,
		`Namespace: ${namespace}`,
		JSON.stringify(sourceValue, null, 2)
	].join('\n\n')
}

function normalizeNamespacePayload(parsed, namespace) {
	return isObject(parsed) &&
		Object.keys(parsed).length === 1 &&
		Object.prototype.hasOwnProperty.call(parsed, namespace)
		? parsed[namespace]
		: parsed
}

async function requestTranslation(provider, model, system, user) {
	const content =
		provider === 'google'
			? await translateWithGoogle(model, system, user)
			: await translateWithOpenAI(model, system, user)

	if (!content) {
		throw new Error('No content returned from translation provider')
	}

	return content
}

async function translateNamespace(provider, model, langCode, namespace, sourceValue) {
	const langMeta = LANGS[langCode]
	const system = buildSystemPrompt(langMeta)
	const user = buildTranslatePrompt(langMeta, namespace, sourceValue)

	let lastError = null

	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			const content = await requestTranslation(provider, model, system, user)
			const parsed = JSON.parse(content)
			const normalized = normalizeNamespacePayload(parsed, namespace)
			compareShape(sourceValue, normalized, [namespace])
			return normalized
		} catch (error) {
			lastError = error
			if (attempt === 3) break

			const repairPrompt = [
				`Your previous translation for namespace "${namespace}" was invalid.`,
				`Validation error: ${error.message || error}`,
				'Return corrected JSON only.',
				'Use the same keys and preserve all placeholders exactly.',
				'Here is the English source object again:',
				JSON.stringify(sourceValue, null, 2)
			].join('\n\n')

			try {
				const content = await requestTranslation(provider, model, system, repairPrompt)
				const parsed = JSON.parse(content)
				const normalized = normalizeNamespacePayload(parsed, namespace)
				compareShape(sourceValue, normalized, [namespace])
				return normalized
			} catch (repairError) {
				lastError = repairError
			}
		}
	}

	throw new Error(
		`Failed to translate ${langCode}:${namespace}: ${lastError?.message || lastError}`
	)
}

async function main() {
	const opts = parseArgs(process.argv.slice(2))
	if (opts.help) {
		console.log(usage())
		return
	}

	const provider = resolveProvider(opts)
	const model = opts.model || defaultModelFor(provider)

	for (const lang of opts.langs) {
		if (!LANGS[lang]) {
			throw new Error(`Unsupported lang code: ${lang}`)
		}
	}

	for (const namespace of opts.namespaces) {
		if (!(namespace in en)) {
			throw new Error(`Unknown namespace in en.js: ${namespace}`)
		}
	}

	console.log(`Using provider=${provider} model=${model}`)
	const meta = ensureMetaShape(await loadMeta())

	for (const langCode of opts.langs) {
		const existing = await loadExistingLang(langCode)
		const next = { ...existing }
		if (!isObject(meta.langs[langCode])) meta.langs[langCode] = {}
		console.log(`\n[${langCode}] ${LANGS[langCode].englishName}`)

		for (const namespace of opts.namespaces) {
			const sourceHash = hashNamespace(en[namespace])
			const metaHash = meta.langs[langCode][namespace]?.sourceHash
			const status = namespaceStatus({
				existing,
				namespace,
				sourceValue: en[namespace],
				sourceHash,
				metaHash,
				overwrite: opts.overwrite
			})

			if (status === 'up-to-date') {
				console.log(`- skip ${namespace} (up to date)`)
				continue
			}

			if (status === 'adopt-existing') {
				meta.langs[langCode][namespace] = {
					sourceHash
				}
				console.log(`- skip ${namespace} (adopt existing)`)
				continue
			}

			console.log(`- translate ${namespace} (${status})`)
			next[namespace] = await translateNamespace(
				provider,
				model,
				langCode,
				namespace,
				en[namespace]
			)
			meta.langs[langCode][namespace] = {
				sourceHash
			}
		}

		const filePath = path.join(I18N_DIR, LANGS[langCode].file)
		await fs.writeFile(filePath, toModuleSource(next, langCode), 'utf8')
		console.log(`- wrote ${path.relative(ROOT, filePath)}`)
	}

	await saveMeta(meta)
}

main().catch((error) => {
	console.error(error.message || error)
	process.exit(1)
})
