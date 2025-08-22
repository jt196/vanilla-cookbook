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

const IMG_RE = /\/full\.(jpe?g|png|webp|gif|bmp)$/i

/** ---------- schema.org → text helpers (reusable) ---------- */
function schemaOrgIngredientsToText(v) {
	// recipeIngredient is typically string[]
	if (Array.isArray(v)) return v.map(String).join('\n')
	return typeof v === 'string' ? v : ''
}

function schemaOrgInstructionsToText(v) {
	// recipeInstructions can be:
	// - string
	// - string[]
	// - { "@type": "HowToStep", text: string }[]
	if (typeof v === 'string') return v.trim()
	if (Array.isArray(v)) {
		return v
			.map((step) => {
				if (typeof step === 'string') return step.trim()
				if (step && typeof step === 'object') return String(step.text ?? '').trim()
				return ''
			})
			.filter(Boolean)
			.join('\n\n')
	}
	if (v && typeof v === 'object' && typeof v.text === 'string') return v.text.trim()
	return ''
}

function pickImageUrl(imageField) {
	// schema.org image can be string | {url} | string[]
	if (!imageField) return null
	if (typeof imageField === 'string') return imageField
	if (Array.isArray(imageField)) {
		const first = imageField[0]
		if (typeof first === 'string') return first
		if (first && typeof first === 'object' && typeof first.url === 'string') return first.url
		return null
	}
	if (typeof imageField === 'object' && typeof imageField.url === 'string') return imageField.url
	return null
}

/**
 * Extract Nextcloud recipes from a ZIP Buffer.
 * Structure:
 *   <dir>/
 *     recipe.json
 *     full.jpg (we prefer this)
 *     thumb.jpg (ignored)
 *
 * We keep the original JSON object and augment it with:
 *   - photo/photo_data if full.jpg exists (base64)
 *   - photo_url as fallback from schema.org "image"
 */
async function extractNextcloudFromZipBuffer(buffer) {
	const directory = await openZipFromBuffer(buffer)

	// Find every "<dir>/recipe.json"
	const recipeJsonEntries = directory.files.filter((f) => /^[^/]+\/recipe\.json$/i.test(f.path))
	if (!recipeJsonEntries.length) throw new Error('Nextcloud: no recipe.json files found.')

	const raws = []

	for (const entry of recipeJsonEntries) {
		const folderPrefix = entry.path.replace(/recipe\.json$/i, '') // "<dir>/"
		const jsonBuf = await readZipEntryBuffer(entry)
		const obj = JSON.parse(jsonBuf.toString('utf-8'))

		// Prefer local full.jpg in the same folder
		const fullImgEntry = directory.files.find(
			(f) => f.path.startsWith(folderPrefix) && IMG_RE.test(f.path)
		)
		if (fullImgEntry) {
			const ibuf = await readZipEntryBuffer(fullImgEntry)
			obj.photo = fullImgEntry.path.split('/').pop() // preserve filename/extension
			obj.photo_data = ibuf.toString('base64')
		}

		// Fallback remote image URL from schema.org "image"
		const urlFromSchema = pickImageUrl(obj.image)
		if (urlFromSchema && !obj.photo_data) {
			obj.photo_url = urlFromSchema
		}

		raws.push(obj)
	}

	// Minimal structural check
	const probe = raws[0]
	if (!(probe && typeof probe.name === 'string')) {
		throw new Error('Invalid recipe structure (missing name).')
	}
	return raws
}

/** ---------- Field map: Nextcloud(schema.org) → DB Recipe ---------- */
const NEXTCLOUD_FIELD_MAP = {
	name: 'name',
	description: 'description',
	recipeIngredient: 'ingredients', // transform
	recipeInstructions: 'directions', // transform
	prepTime: 'prep_time', // keep ISO 8601 duration string
	cookTime: 'cook_time',
	totalTime: 'total_time',
	recipeYield: 'servings', // transform to string
	aggregateRating: 'rating', // transform from ratingValue
	nutrition: 'nutritional_info', // transform JSON.stringify
	datePublished: 'created', // transform -> Date
	// Prefer mainEntityOfPage, fallback to url
	mainEntityOfPage: 'source_url',
	url: 'source_url',
	// Optionally persist the remote image URL too (even though we prefer local full.jpg)
	image: 'image_url' // transform to simple URL string
}

/** ---------- Transforms keyed by source keys ---------- */
const NEXTCLOUD_TRANSFORMS = {
	recipeIngredient: (v) => schemaOrgIngredientsToText(v),
	recipeInstructions: (v) => schemaOrgInstructionsToText(v),

	recipeYield: (v) => (v != null ? String(v) : null),

	aggregateRating: (v) => {
		// { ratingValue } or other shapes; coerce to number
		const rv = v && typeof v === 'object' ? v.ratingValue : null
		const n = parseFloat(String(rv ?? '').replace(',', '.'))
		return Number.isFinite(n) ? n : null
	},

	nutrition: (v) => (v && typeof v === 'object' ? JSON.stringify(v) : null),

	datePublished: (v) => toDateSafe(v),

	// source_url fallbacks — whichever runs first sets it; later calls keep existing
	mainEntityOfPage: (v, _src, out) => (out.source_url ??= v || null),
	url: (v, _src, out) => (out.source_url ??= v || null),

	// flatten schema.org image to URL for DB.image_url (optional)
	image: (v) => pickImageUrl(v)
}

/** ---------- Photo strategy: prefer embedded full.jpg; fallback to URL ---------- */
const NEXTCLOUD_PHOTO_STRATEGY = {
	base64Main: { filenameKey: 'photo', dataKey: 'photo_data' },
	urlOrder: ['photo_url', 'image_url']
}

/** ---------- Main entry (run) ---------- */
export async function importNextcloudFromBuffer({ buffer, userId, isPublic }) {
	// 1) Extract originals and augment with photo hints
	const raw = await extractNextcloudFromZipBuffer(buffer)
	if (!raw?.length) return { inserted: 0, message: 'No recipes found.' }

	// 2) Map to DB via pure map + transforms; inject flags + ensure created
	const parsed = mapListByConfig(raw, NEXTCLOUD_FIELD_MAP, NEXTCLOUD_TRANSFORMS, {
		is_public: !!isPublic
	}).map((row) => ({
		created: row.created ?? new Date(),
		...row
	}))

	if (!isValidRecipeStructure(parsed)) {
		throw new Error('Invalid recipe structure after mapping.')
	}

	// 3) Insert
	const created = await addRecipesToDB(parsed, userId)

	// 4) Photos via unified strategy
	const pairs = pairByIndex(created, raw)
	const failed = await importPhotosForPairs({ pairs, strategy: NEXTCLOUD_PHOTO_STRATEGY })
	const extra = failed.length ? ` (${failed.length} photo imports failed.)` : ''

	return {
		inserted: created.length,
		message: `Imported ${created.length} Nextcloud recipe(s).${extra}`
	}
}
