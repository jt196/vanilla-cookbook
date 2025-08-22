// Plain JS
import {
	openZipFromBuffer,
	readZipEntryBuffer,
	mapListByConfig,
	toDateSafe,
	pairByIndex,
	isValidRecipeStructure,
	addRecipesToDB
} from '$lib/utils/import/importHelpers.js'
import { importPhotosForPairs } from '$lib/utils/import/photoHelpers.js'

const IMG_RE = /\.(png|jpe?g|webp|gif|bmp)$/i

/** Convert Mealie ingredient objects → newline text */
function ingredientsToText(arr = []) {
	return arr
		.map((it) => {
			if (it?.display) return it.display
			if (it?.note) return it.note
			const qty = it?.quantity != null ? String(it.quantity) : ''
			const unit = it?.unit?.abbreviation || it?.unit?.plural_abbreviation || it?.unit?.name || ''
			const food = it?.food?.name || ''
			const line = [qty, unit, food].filter(Boolean).join(' ').trim()
			return line || ''
		})
		.filter(Boolean)
		.join('\n')
}

/** Convert Mealie instructions array → paragraphs */
function instructionsToText(steps = []) {
	return steps
		.map((s) => (typeof s?.text === 'string' ? s.text.trim() : ''))
		.filter(Boolean)
		.join('\n\n')
}

/**
 * Extract Mealie recipes from a ZIP Buffer
 * Structure:
 *   recipes/<dir>/
 *     <anything>.json
 *     images/
 *       image1.jpg, image2.webp, ...
 *
 * We keep each recipe as its original JSON object and just *augment* it with:
 *   - photos: [{ filename, data(base64) }]
 */
async function extractMealieFromZipBuffer(buffer) {
	const directory = await openZipFromBuffer(buffer)

	const jsonEntries = directory.files.filter((f) => /^recipes\/[^/]+\/[^/]+\.json$/i.test(f.path))
	if (!jsonEntries.length) throw new Error('Mealie: No recipe JSON files under recipes/.')

	const raws = []

	for (const jsonEntry of jsonEntries) {
		const folderPrefix = jsonEntry.path.replace(/\/[^/]+$/, '/') // 'recipes/<dir>/'
		const jsonBuf = await readZipEntryBuffer(jsonEntry)
		const obj = JSON.parse(jsonBuf.toString('utf-8'))

		// Gather images from sibling images/
		const imagesPrefix = folderPrefix + 'images/'
		const imageEntries = directory.files.filter(
			(f) => f.path.startsWith(imagesPrefix) && IMG_RE.test(f.path)
		)

		if (imageEntries.length) {
			obj.photos = await Promise.all(
				imageEntries.map(async (a) => {
					const abuf = await readZipEntryBuffer(a)
					return {
						filename: a.path.split('/').pop(),
						data: abuf.toString('base64')
					}
				})
			)
		}

		raws.push(obj)
	}

	// Minimal structural check: first item must have a name
	const probe = raws[0]
	if (!(probe && typeof probe.name === 'string')) {
		throw new Error('Invalid recipe structure (missing name).')
	}
	return raws
}

/** ---------- Map: Mealie keys → DB Recipe columns (pure map, no ad-hoc building) ---------- */
const MEALIE_FIELD_MAP = {
	name: 'name',
	description: 'description',
	recipe_ingredient: 'ingredients', // via transform
	recipe_instructions: 'directions', // via transform
	org_url: 'source_url',
	total_time: 'total_time',
	prep_time: 'prep_time',
	cook_time: 'cook_time',
	// multiple fallbacks to the SAME target key 'servings'
	recipe_servings: 'servings',
	recipe_yield: 'servings',
	recipe_yield_quantity: 'servings',
	rating: 'rating',
	notes: 'notes',
	nutrition: 'nutritional_info',
	// created has multiple potential source fields; drive from created_at entry
	created_at: 'created',
	date_added: 'created',
	date_updated: 'created',
	updated_at: 'created'
}

/** ---------- Transforms keyed by source keys (keep logic here, not in ad-hoc builders) ---------- */
const MEALIE_TRANSFORMS = {
	recipe_ingredient: (v) => ingredientsToText(v),
	recipe_instructions: (v) => instructionsToText(v),
	notes: (v) =>
		Array.isArray(v) ? v.map((n) => (typeof n === 'string' ? n : n?.text || '')).join('\n\n') : v,
	nutrition: (v) => (v && typeof v === 'object' ? JSON.stringify(v) : null),

	// Fallback chain for 'servings' — whichever mapping runs first may set it,
	// later ones only set if it's still empty.
	recipe_servings: (v, _src, out) => (out.servings ??= v != null ? String(v) : null),
	recipe_yield: (v, _src, out) => (out.servings ??= v != null ? String(v) : null),
	recipe_yield_quantity: (v, _src, out) => (out.servings ??= v != null ? String(v) : null),

	// Created date: whichever of these fires first sets the value;
	// toDateSafe handles strings/ISO. Later ones won't overwrite.
	created_at: (v, _src, out) => (out.created ??= toDateSafe(v)),
	date_added: (v, _src, out) => (out.created ??= toDateSafe(v)),
	date_updated: (v, _src, out) => (out.created ??= toDateSafe(v)),
	updated_at: (v, _src, out) => (out.created ??= toDateSafe(v))
}

/** Base64-only photo strategy (we embedded images from the archive) */
const MEALIE_PHOTO_STRATEGY = {
	base64List: { listKey: 'photos', filenameKey: 'filename', dataKey: 'data' }
}

/** ---------- Main entry (run) ---------- */
export async function importMealieFromBuffer({ buffer, userId, isPublic }) {
	// 1) Extract original Mealie objects and augment with photos (base64)
	const raw = await extractMealieFromZipBuffer(buffer)
	if (!raw?.length) return { inserted: 0, message: 'No recipes found.' }

	// 2) Map Mealie → DB using just the map + transforms; inject flags + required fields
	const parsed = mapListByConfig(raw, MEALIE_FIELD_MAP, MEALIE_TRANSFORMS, {
		is_public: !!isPublic
	}).map((row) => ({
		// ensure created exists even if no date fields present
		created: row.created ?? new Date(),
		...row
	}))

	if (!isValidRecipeStructure(parsed)) {
		throw new Error('Invalid recipe structure after mapping.')
	}

	// 3) Insert
	const created = await addRecipesToDB(parsed, userId)

	// 4) Pair created ↔ raw and import photos via the unified strategy
	const pairs = pairByIndex(created, raw)
	const failed = await importPhotosForPairs({ pairs, strategy: MEALIE_PHOTO_STRATEGY })
	const extra = failed?.length ? ` (${failed.length} photo sets failed.)` : ''

	return {
		inserted: created.length,
		message: `Imported ${created.length} Mealie recipe(s).${extra}`
	}
}
