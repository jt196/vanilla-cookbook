// src/lib/utils/import/sources/chowdown.js
import {
	openZipFromBuffer,
	findZipEntries,
	readZipEntryBuffer,
	mapListByConfig,
	pairByIndex,
	toDateSafe,
	parseFrontMatterMarkdown,
	isValidRecipeStructure,
	addRecipesToDB
} from '$lib/utils/import/importHelpers.js'
import { importPhotosForPairs } from '$lib/utils/import/photoHelpers.js'

const IMG_RE = /\.(jpe?g|png|gif|webp|bmp)$/i

/** Parse a Chowdown markdown file (front-matter + body) → normalized raw object */
function mdToRaw(md) {
	const { meta, body } = parseFrontMatterMarkdown(md)
	const ingredients = Array.isArray(meta.ingredients) ? meta.ingredients.join('\n') : ''
	const directions = Array.isArray(meta.directions) ? meta.directions.join('\n') : ''
	return {
		name: meta.title || meta.name || '',
		description: (body || '').trim(),
		ingredients,
		directions,
		created: meta.date || meta.created || new Date().toISOString(),
		image: meta.image || null // could be URL or local filename
	}
}

/** Extract recipes + local images from a Chowdown ZIP (in memory) */
async function extractChowdownFromZipBuffer(buffer) {
	const directory = await openZipFromBuffer(buffer)

	// All markdown recipes under _recipes/
	const mdEntries = findZipEntries(directory, (f) => /(^|\/)_recipes\/.+\.md$/i.test(f.path))
	if (!mdEntries.length) throw new Error('Chowdown: no markdown recipes under _recipes/')

	// Index images/ by lowercase basename for fast lookup
	const imageEntries = findZipEntries(directory, (f) =>
		/(^|\/)images\/.+\.(jpe?g|png|gif|webp|bmp)$/i.test(f.path)
	)
	const imageIndex = new Map()
	for (const ent of imageEntries) {
		const base = ent.path.split('/').pop().toLowerCase()
		imageIndex.set(base, ent)
	}

	const raws = []
	for (const entry of mdEntries) {
		const buf = await readZipEntryBuffer(entry)
		const raw = mdToRaw(buf.toString('utf-8'))
		if (!raw.name) continue

		// Photo hints for strategy:
		// - URL? set photo_url
		// - local filename? embed base64 into photo_data + filename
		const img = (raw.image || '').trim()
		if (img) {
			if (/^https?:\/\//i.test(img)) {
				raw.photo_url = img
			} else {
				const base = img.split('/').pop().toLowerCase()
				const ent = imageIndex.get(base)
				if (ent) {
					const ibuf = await readZipEntryBuffer(ent)
					raw.photo = img.split('/').pop() // preserve original filename
					raw.photo_data = ibuf.toString('base64') // base64 for strategy
				}
			}
		}

		raws.push(raw)
	}

	if (!isValidRecipeStructure(raws)) throw new Error('Invalid recipe structure.')
	return raws
}

/** Field map: Chowdown raw → DB Recipe */
const CHOW_FIELD_MAP = {
	name: 'name',
	description: 'description',
	ingredients: 'ingredients',
	directions: 'directions',
	created: 'created' // transformed below
}

const CHOW_TRANSFORMS = {
	created: (v) => toDateSafe(v)
}

/** Photo strategy: prefer embedded base64; otherwise try URL */
const CHOW_PHOTO_STRATEGY = {
	base64Main: { filenameKey: 'photo', dataKey: 'photo_data' },
	urlOrder: ['photo_url', 'image_url', 'image']
}

export async function importChowdownFromBuffer({ buffer, userId, isPublic }) {
	// 1) Extract raw recipes (+ embedded photo data or URL hints)
	const raw = await extractChowdownFromZipBuffer(buffer)
	if (!raw?.length) return { inserted: 0, message: 'No recipes found.' }

	// 2) Map to DB fields; inject flags
	const parsed = mapListByConfig(raw, CHOW_FIELD_MAP, CHOW_TRANSFORMS, {
		is_public: !!isPublic,
		source: 'Chowdown'
	})

	// 3) Insert
	const created = await addRecipesToDB(parsed, userId)

	// 4) Pair created ↔ raw and import photos via the unified strategy
	const pairs = pairByIndex(created, raw)
	const failed = await importPhotosForPairs({ pairs, strategy: CHOW_PHOTO_STRATEGY })
	const extra = failed.length ? ` (${failed.length} photo imports failed.)` : ''

	return { inserted: created.length, message: `Imported ${created.length} recipe(s).${extra}` }
}
