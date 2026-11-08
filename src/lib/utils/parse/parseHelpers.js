import parseIsoDuration from 'parse-iso-duration'
import humanizeDuration from 'humanize-duration'
import * as he from 'he'

// ---------------------------------------------------------------------------
// Field normalisers: turn one schema.org Recipe property into the shape we store
// ---------------------------------------------------------------------------

/**
 * Extract the author's name.
 * @param {string|Object|Array<Object>} author - A name, a Person/Organization, or a list of them.
 * @returns {string|undefined}
 */
export function getAuthor(author) {
	if (typeof author === 'string') return author
	if (Array.isArray(author)) return author[0].name
	return author?.name
}

/**
 * Convert an ISO 8601 duration (e.g. "PT1H30M") to text; returns the input if it isn't one.
 * @param {string} duration
 * @returns {string}
 */
export function durationToText(duration) {
	try {
		return humanizeDuration(parseIsoDuration(duration))
	} catch {
		return duration
	}
}

/**
 * Flatten recipe instructions to a list of step strings.
 * Accepts a string, HowToStep/HowToSection objects, or (nested) arrays of either.
 * Sections contribute their steps; a node with text but no steps contributes its text.
 *
 * @param {unknown} instructions
 * @returns {string[]}
 */
export function parseInstructions(instructions) {
	if (!instructions) return []
	if (typeof instructions === 'string') return instructions.trim() ? [instructions] : []
	if (Array.isArray(instructions)) return instructions.flatMap(instructionSteps)
	if (typeof instructions === 'object') return instructionSteps(instructions)
	return []
}

/** @returns {string[]} */
function instructionSteps(node) {
	if (!node) return []
	if (typeof node === 'string') return node.trim() ? [node] : []
	if (Array.isArray(node)) return node.flatMap(instructionSteps)
	if (typeof node !== 'object') return []

	const text = instructionText(node)
	if (text && !Array.isArray(node.itemListElement)) return [text]

	const steps = instructionSteps(node.itemListElement || node.itemList || [])
	if (steps.length) return steps
	return text ? [text] : []
}

/**
 * A step's text. Some sites (e.g. einfachkochen.de) emit `text` as an array of
 * comma-split fragments, so arrays are re-joined with ', '.
 * @returns {string} Trimmed text, or '' if none.
 */
function instructionText(node) {
	const value = node.text || node.name
	if (Array.isArray(value)) {
		return value
			.filter((part) => typeof part === 'string')
			.map((part) => part.trim())
			.filter(Boolean)
			.join(', ')
	}
	return typeof value === 'string' ? value.trim() : ''
}

/**
 * Normalise ingredients to a list. A single string is treated as comma-separated.
 * @param {string|string[]} ingredients
 * @returns {string[]}
 */
export function parseIngredients(ingredients) {
	if (Array.isArray(ingredients)) return ingredients
	if (typeof ingredients === 'string') {
		return ingredients
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
	}
	return []
}

/**
 * Normalise keywords to a list. A single string is treated as comma-separated.
 * @param {string|string[]} keywords
 * @returns {string[]}
 */
export function parseKeywords(keywords) {
	if (Array.isArray(keywords)) return keywords.map((k) => k.trim())
	if (typeof keywords === 'string') return keywords.split(',').map((k) => k.trim())
	return []
}

/**
 * The image URL from a URL, an ImageObject, or a list of either (first usable one wins).
 * @param {string|Object|Array<string|Object>} image
 * @returns {string|undefined}
 */
export function getImage(image) {
	if (!image) return undefined
	if (typeof image === 'string') return image
	if (Array.isArray(image)) return image.map(getImage).find(Boolean)
	return image.url || image.contentUrl
}

/**
 * The rating value from an AggregateRating.
 * @param {{ ratingValue?: string|number }} rating
 * @returns {number|undefined}
 */
export function getRating(rating) {
	if (!rating) return undefined
	return parseFloat(String(rating.ratingValue))
}

/**
 * Video fields from a URL, a VideoObject, or a list of VideoObjects (first one used).
 * @param {string|Object|Array<Object>} video
 * @returns {{ videoUrl?: string, videoThumbnail?: string, videoTitle?: string }}
 */
export function parseVideo(video) {
	if (!video) return {}
	if (typeof video === 'string') return { videoUrl: video }
	if (Array.isArray(video)) {
		const [first] = video
		if (!first) return {}
		return {
			videoUrl: first.url || first.embedUrl,
			videoThumbnail: first.thumbnailUrl,
			videoTitle: first.name
		}
	}
	return {
		videoThumbnail: video.thumbnailUrl,
		videoTitle: video.name,
		videoUrl: video.contentUrl || video.embedUrl
	}
}

/**
 * Normalise schema.org `tool` data (Recipe inherits it from HowTo) to a list of names.
 * Accepts a string, a HowToTool object ({ name } or { text }), or a (nested) array of either.
 * Duplicates (case-insensitive) and empty entries are dropped.
 *
 * @param {unknown} tool - The raw `tool` value.
 * @returns {string[]} Equipment names, in source order.
 */
export function parseTools(tool) {
	const names = []
	const visit = (value) => {
		if (!value) return
		if (Array.isArray(value)) return value.forEach(visit)
		if (typeof value === 'string') return names.push(value)
		if (typeof value === 'object') {
			const name = value.name ?? value.text
			if (typeof name === 'string') names.push(name)
		}
	}
	visit(tool)

	const seen = new Set()
	return names
		.map((name) => name.replace(/\s+/g, ' ').trim())
		.filter((name) => {
			const key = name.toLowerCase()
			if (!name || seen.has(key)) return false
			seen.add(key)
			return true
		})
}

/**
 * Decode HTML entities and collapse all whitespace (including newlines) to single spaces.
 * @param {string} str
 * @returns {string} The cleaned string ('' for non-strings).
 */
function cleanString(str) {
	if (typeof str !== 'string') return ''
	return he.decode(str).replace(/\s+/g, ' ').trim()
}

/**
 * Recursively apply `cleanString` to every string in an object, array, or scalar.
 * Other values (numbers, booleans, null) pass through unchanged.
 * @param {*} value
 * @returns {*}
 */
export function cleanObjectStrings(value) {
	if (typeof value === 'string') return cleanString(value)
	if (Array.isArray(value)) return value.map(cleanObjectStrings)
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cleanObjectStrings(v)]))
	}
	return value
}

/**
 * The hostname of an http(s) URL without a leading "www.".
 * @param {string} url
 * @returns {string} The domain, or '' if `url` isn't an http(s) URL.
 */
export function getDomainFromUrl(url) {
	if (typeof url !== 'string') return ''
	const trimmed = url.trim()
	if (!/^https?:\/\//i.test(trimmed)) return ''
	try {
		return new URL(trimmed).hostname.replace('www.', '')
	} catch {
		return ''
	}
}

// ---------------------------------------------------------------------------
// Source 1: JSON-LD (<script type="application/ld+json">)
// ---------------------------------------------------------------------------

const JSON_LD_SELECTOR = 'script[type="application/ld+json"], script[type=\'application/ld+json\']'

/**
 * Whether a schema.org `@type` (a string or a list) is Recipe, ignoring case.
 * @param {unknown} type
 * @returns {boolean}
 */
export function isRecipeType(type) {
	return [type].flat().some((t) => typeof t === 'string' && t.toLowerCase() === 'recipe')
}

/**
 * Every object in a JSON-LD document, in document order: the top-level value, members of
 * arrays, and members of `@graph` (at any depth).
 * @param {unknown} value
 * @returns {Generator<Object>}
 */
function* jsonLdNodes(value) {
	if (Array.isArray(value)) {
		for (const item of value) yield* jsonLdNodes(item)
	} else if (value && typeof value === 'object') {
		yield value
		if (value['@graph']) yield* jsonLdNodes(value['@graph'])
	}
}

/**
 * Tidy JSON-LD text that sites often emit slightly malformed: drop tabs, and replace raw
 * newlines inside string values (invalid JSON) with spaces.
 * @param {string} json
 * @returns {string}
 */
function cleanJsonString(json) {
	return json
		.replace(/\t/g, '')
		.replace(/ & /g, '&')
		.replace(/"([^"]+)"/g, (match) => match.replace(/\n/g, ' '))
		.trim()
}

/** Parse one JSON-LD script tag, or null if it isn't valid JSON. */
function readJsonLdScript(script) {
	try {
		return JSON.parse(cleanJsonString(script.innerHTML || script.rawText || ''))
	} catch (err) {
		console.error('Error parsing JSON-LD:', err.message)
		return null
	}
}

/**
 * Find the schema.org Recipe in a page's JSON-LD.
 *
 * Pages often have several JSON-LD blocks (WebSite, BreadcrumbList, ...) and may nest the
 * Recipe inside an array or `@graph`. The first Recipe with ingredients wins, else the
 * first Recipe at all.
 *
 * With no Recipe, the last JSON-LD block is returned as partial data if it is a single
 * plain object (typically the post's Article, giving a name, author and description for
 * the other sources to complete). Blocks that are arrays or `@graph` wrappers are not used
 * this way.
 *
 * @param {import('node-html-parser').HTMLElement} root - The parsed page.
 * @returns {Object|null} The raw Recipe node, the partial fallback object, or null.
 */
export function parseJSONLD(root) {
	const blocks = root.querySelectorAll(JSON_LD_SELECTOR).map(readJsonLdScript).filter(Boolean)

	const recipes = blocks
		.flatMap((block) => [...jsonLdNodes(block)])
		.filter((node) => isRecipeType(node['@type']))
	if (recipes.length) return recipes.find((node) => node.recipeIngredient) ?? recipes[0]

	const last = blocks.at(-1)
	const isPlainObject = last && typeof last === 'object' && !Array.isArray(last)
	return isPlainObject && !last['@graph'] ? last : null
}

// ---------------------------------------------------------------------------
// Reading values from HTML elements (shared by microdata and site configs)
// ---------------------------------------------------------------------------

/** An element's value: its `content` attribute (meta tags), `data-src` (lazy images), or text. */
function nodeValue(el) {
	return el.getAttribute('content') || el.getAttribute('data-src') || el.text || null
}

/** Non-empty values of every element matching `selector`. */
function selectValues(root, selector) {
	return root.querySelectorAll(selector).map(nodeValue).filter(Boolean)
}

/** Text of each child element of every container matching `selector`. */
function childElementTexts(root, selector) {
	return root.querySelectorAll(selector).flatMap((el) =>
		el.childNodes
			.filter((child) => child.nodeType === 1) // element nodes only
			.map((child) => child.text || child.textContent || '')
			.filter(Boolean)
	)
}

// ---------------------------------------------------------------------------
// Source 2: per-site CSS selector configs (see siteConfigurations.js)
// ---------------------------------------------------------------------------

/**
 * Extract recipe fields using a site's CSS selectors.
 * @param {import('node-html-parser').HTMLElement} root - The parsed page.
 * @param {Object} config - Selector config from siteConfigurations.js.
 * @returns {Object} Recipe fields named as in schema.org.
 */
export function parseUsingSiteConfig(root, config) {
	const all = (selector) =>
		selector
			? selectValues(root, selector)
					.map((v) => v.trim())
					.filter(Boolean)
			: []
	const one = (selector) => all(selector)[0] ?? null

	return {
		recipeYield: one(config.servingsSelector),
		prepTime: one(config.prepTimeSelector),
		cookTime: one(config.cookTimeSelector),
		totalTime: one(config.totalTimeSelector),
		recipeIngredient: all(config.ingredientsSelector),
		recipeInstructions: all(config.instructionsSelector),
		recipeCategory: all(config.categorySelector),
		description: one(config.descriptionSelector),
		notes: one(config.notesSelector),
		name: one(config.nameSelector)
	}
}

// ---------------------------------------------------------------------------
// Source 3: schema.org microdata (itemscope / itemprop attributes)
// ---------------------------------------------------------------------------

const MICRODATA_RECIPE =
	'[itemscope][itemtype="http://schema.org/Recipe"], [itemscope][itemtype="https://schema.org/Recipe"]'

/** Single-valued microdata properties copied straight through. */
const MICRODATA_FIELDS = [
	'description',
	'prepTime',
	'totalTime',
	'keywords',
	'recipeCategory',
	'recipeCuisine',
	'recipeYield',
	'datePublished',
	'video'
]

const itemprop = (name) => `[itemprop="${name}"]`

/**
 * Child itemprops of a nested item (e.g. aggregateRating, nutrition) as a plain object.
 * @returns {Object|null} null if the item isn't present.
 */
function nestedItemProps(root, name) {
	const item = root.querySelector(itemprop(name))
	if (!item) return null

	const props = {}
	for (const el of item.querySelectorAll('[itemprop]')) {
		const content = el.getAttribute('content')
		if (content) props[el.getAttribute('itemprop')] = content
		else if (el.text) props[el.getAttribute('itemprop')] = el.text.trim()
	}
	return props
}

/**
 * Microdata ingredients: `recipeIngredient`, else the older `ingredients`, else
 * `ingredient` items with separate amount/name parts (e.g. tastykitchen).
 */
function microdataIngredients(item) {
	const modern = selectValues(item, itemprop('recipeIngredient'))
	if (modern.length) return modern

	const legacy = selectValues(item, itemprop('ingredients'))
	if (legacy.length) return legacy

	return item.querySelectorAll(itemprop('ingredient')).flatMap((el) => {
		const amount = el.querySelector(itemprop('amount'))?.textContent.trim()
		const name = el.querySelector(itemprop('name'))?.textContent.trim()
		if (name === undefined) return []
		return [amount !== undefined ? `${amount} ${name}` : name]
	})
}

/**
 * Microdata instructions: each `recipeInstructions` element is one step. The older
 * `instructions` property marks a container whose child elements are the steps.
 */
function microdataInstructions(item) {
	const steps = selectValues(item, itemprop('recipeInstructions'))
	return steps.length ? steps : childElementTexts(item, itemprop('instructions'))
}

/**
 * Extract a Recipe from schema.org microdata. If the page has no Recipe itemscope, the whole
 * page is searched and the page title is used as the name.
 *
 * @param {import('node-html-parser').HTMLElement} root - The parsed page.
 * @returns {Object} Recipe fields named as in schema.org.
 */
export function extractMicrodata(root) {
	const recipeItem = root.querySelector(MICRODATA_RECIPE)
	const item = recipeItem || root
	const first = (name) => selectValues(item, itemprop(name))[0]

	return {
		// Outside a Recipe itemscope, itemprop="name" could belong to anything on the page
		name: recipeItem ? first('name') : (root.querySelector('title')?.text ?? ''),
		...Object.fromEntries(MICRODATA_FIELDS.map((field) => [field, first(field)])),
		recipeIngredient: microdataIngredients(item),
		recipeInstructions: microdataInstructions(item),
		image: selectValues(item, '[itemprop*="image"]')[0],
		sourceUrl: first('url'),
		aggregateRating: nestedItemProps(item, 'aggregateRating'),
		nutrition: nestedItemProps(item, 'nutrition'),
		tool: selectValues(item, itemprop('tool'))
	}
}
