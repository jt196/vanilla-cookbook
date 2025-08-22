// Plain JS
import {
	openZipFromBuffer,
	readZipEntryBuffer,
	mapListByConfig,
	pairByIndex,
	isValidRecipeStructure,
	addRecipesToDB
} from '$lib/utils/import/importHelpers.js'

import { importPhotosForPairs } from '$lib/utils/import/photoHelpers.js'

// --- tiny helpers ---

function tandoorIngredientsToText(steps = []) {
	const lines = []
	for (const s of steps || []) {
		if (Array.isArray(s.ingredients)) {
			for (const it of s.ingredients) {
				const qty = it?.amount != null && it.amount !== 0 ? String(it.amount) : ''
				const unit = it?.unit?.name || it?.unit?.abbreviation || it?.unit?.plural_name || ''
				const food = it?.food?.name || ''
				const note = it?.note || ''
				const line = [qty, unit, food, note].filter(Boolean).join(' ').trim()
				if (line) lines.push(line)
			}
		}
	}
	return lines.join('\n')
}

function tandoorDirectionsToText(steps = []) {
	return (steps || [])
		.map((s) => (typeof s?.instruction === 'string' ? s.instruction.trim() : ''))
		.filter(Boolean)
		.join('\n\n')
}

function normalizeServings(obj) {
	if (obj?.servings != null) return String(obj.servings)
	if (obj?.servings_text) return String(obj.servings_text)
	return null
}

function minutesToString(min) {
	if (min == null) return null
	const n = Number(min)
	if (!Number.isFinite(n) || n <= 0) return null
	return `${n} min`
}

// --- extraction ---

/**
 * Tandoor export:
 *   tandoor.zip
 *     1.zip
 *       recipe.json
 *       image      (or image.jpg / image.png ...)
 *     2.zip
 *       ...
 */
async function extractTandoorFromZipBuffer(buffer) {
	const outer = await openZipFromBuffer(buffer)

	// take all top-level *.zip members
	const innerZips = outer.files.filter((f) => /\.zip$/i.test(f.path))
	if (!innerZips.length) throw new Error('Tandoor: no inner .zip members found.')

	const raws = []

	for (const z of innerZips) {
		const innerBuf = await readZipEntryBuffer(z)
		const inner = await openZipFromBuffer(innerBuf)

		// recipe.json
		const recipeEntry = inner.files.find((f) => /(^|\/)recipe\.json$/i.test(f.path))
		if (!recipeEntry) continue

		const obj = JSON.parse((await readZipEntryBuffer(recipeEntry)).toString('utf-8'))

		// image (with or without extension)
		const imgEntry = inner.files.find((f) => /(^|\/)image(\.[^.\/]+)?$/i.test(f.path)) || null

		let photo = null
		let photo_data = null
		if (imgEntry) {
			const b = await readZipEntryBuffer(imgEntry)
			const base = imgEntry.path.split('/').pop() // may be "image" with no ext
			photo = base // ext-less is fine; photo saver defaults to jpg
			photo_data = b.toString('base64')
		}

		// Build a “raw” (Paprika-shaped) object (no categories/de-dupe)
		const raw = {
			name: obj.name || '',
			description: typeof obj.description === 'string' ? obj.description : null,
			ingredients: tandoorIngredientsToText(obj.steps),
			directions: tandoorDirectionsToText(obj.steps),
			notes: null,

			// times: working_time (prep-ish) + waiting_time (cook-ish?) -> keep simple
			prep_time: minutesToString(obj.working_time),
			cook_time: minutesToString(obj.waiting_time),
			total_time:
				minutesToString((Number(obj.working_time) || 0) + (Number(obj.waiting_time) || 0)) || null,

			servings: normalizeServings(obj),
			rating: null,
			source: null,
			source_url: obj.source_url || null,

			created: new Date().toISOString(), // transform → Date in map
			nutritional_info:
				obj.nutrition && typeof obj.nutrition === 'object' ? JSON.stringify(obj.nutrition) : null,

			// photo payload (prefer embedded image)
			photo,
			photo_data,
			photos: [],

			// flags/defaults to satisfy schema
			on_favorites: false,
			on_grocery_list: false,
			is_pinned: false,
			in_trash: false,
			image_url: null,
			photo_url: null,
			scale: null,
			hash: null,
			difficulty: null
		}

		if (raw.name) raws.push(raw)
	}

	if (!isValidRecipeStructure(raws)) {
		throw new Error('Invalid recipe structure.')
	}
	return raws
}

// --- map + transforms ---

const TANDOOR_FIELD_MAP = {
	rating: 'rating',
	photo: 'photo',
	ingredients: 'ingredients',
	source: 'source',
	total_time: 'total_time',
	hash: 'hash',
	description: 'description',
	source_url: 'source_url',
	difficulty: 'difficulty',
	on_grocery_list: 'on_grocery_list',
	in_trash: 'in_trash',
	directions: 'directions',
	photo_url: 'photo_url',
	cook_time: 'cook_time',
	name: 'name',
	created: 'created', // -> Date
	notes: 'notes',
	image_url: 'image_url',
	prep_time: 'prep_time',
	servings: 'servings',
	nutritional_info: 'nutritional_info',
	on_favorites: 'on_favorites',
	is_pinned: 'is_pinned',
	scale: 'scale'
}

const TANDOOR_TRANSFORMS = {
	created: (v) => (v ? new Date(v) : new Date())
}

// photos: embedded base64 main only (no URLs from export)
const TANDOOR_PHOTO_STRATEGY = {
	base64Main: { filenameKey: 'photo', dataKey: 'photo_data' }
}

// --- main entry ---

export async function importTandoorFromBuffer({ buffer, userId, isPublic }) {
	const raw = await extractTandoorFromZipBuffer(buffer)
	if (!raw?.length) return { inserted: 0, message: 'No recipes found.' }

	const parsed = mapListByConfig(raw, TANDOOR_FIELD_MAP, TANDOOR_TRANSFORMS, {
		is_public: !!isPublic
	})

	const created = await addRecipesToDB(parsed, userId)

	const pairs = pairByIndex(created, raw)
	const failed = await importPhotosForPairs({ pairs, strategy: TANDOOR_PHOTO_STRATEGY })
	const extra = failed?.length ? ` (${failed.length} photo imports failed.)` : ''

	return {
		inserted: created.length,
		message: `Imported ${created.length} Tandoor recipe(s).${extra}`
	}
}
