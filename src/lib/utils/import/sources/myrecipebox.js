import { Readable } from 'node:stream'
import csv from 'csv-parser'

import {
	mapListByConfig,
	isValidRecipeStructure,
	addRecipesToDB,
	pairByIndex
} from '$lib/utils/import/importHelpers.js'

import { importPhotosForPairs } from '$lib/utils/import/photoHelpers.js'

// 1) Parse CSV buffer
async function parseCsvBuffer(buffer) {
	return new Promise((resolve, reject) => {
		const rows = []
		Readable.from(buffer)
			.pipe(csv())
			.on('data', (row) => rows.push(row))
			.on('end', () => resolve(rows))
			.on('error', reject)
	})
}

// 2) Field map: CSV headers -> DB columns (exact headers you listed)
const CSV_FIELD_MAP = {
	title: 'name',
	description: 'description',
	preparationTime: 'prep_time',
	cookingTime: 'cook_time',
	totalTime: 'total_time',
	quantity: 'servings',
	ingredients: 'ingredients',
	instructions: 'directions',
	notes: 'notes',
	nutrition: 'nutritional_info',
	favorite: 'on_favorites',
	rating: 'rating',
	// Move "source" directly into source_url (per your instruction)
	source: 'source_url'
	// ignored: inactiveTime, categories, tags, video, originalPicture (handled separately below)
}

// 3) Transforms: keep it simple
const CSV_TRANSFORMS = {
	favorite: (v) => {
		const s = String(v ?? '')
			.trim()
			.toLowerCase()
		return s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === 'on'
	},
	rating: (v) => {
		const n = parseFloat(String(v ?? '').replace(',', '.'))
		return Number.isFinite(n) ? n : null
	}
}

// 4) URL-only photo strategy (download to uploads/images via processImage)
const CSV_PHOTO_STRATEGY = {
	urlOrder: ['photo_url', 'image_url']
}

export async function importMyRecipeBoxFromBuffer({ buffer, userId, isPublic }) {
	const rows = await parseCsvBuffer(buffer)

	// Require a title for each row (maps to Recipe.name)
	const candidateRows = rows.filter((r) => r.title && String(r.title).trim().length)
	if (!candidateRows.length) {
		return { inserted: 0, message: 'No valid rows (missing title) found in CSV.' }
	}

	// Map headers -> DB fields; add required/static fields
	const parsed = mapListByConfig(candidateRows, CSV_FIELD_MAP, CSV_TRANSFORMS, {
		is_public: !!isPublic,
		created: new Date() // schema needs DateTime
	})

	if (!isValidRecipeStructure(parsed)) {
		throw new Error('Invalid recipe structure after CSV mapping.')
	}

	// Insert recipes
	const created = await addRecipesToDB(parsed, userId)

	// Build "raw" objects for photo importer using original CSV columns.
	// We put the CSV's `originalPicture` (if present) into raw.photo_url so the strategy can download it.
	const rawForPhotos = candidateRows.map((r) => ({
		name: r.title,
		photo_url: r.originalPicture || null,
		image_url: null
	}))

	// Pair created ↔ raw by index and download photos (if URLs exist)
	const pairs = pairByIndex(created, rawForPhotos)
	const failed = await importPhotosForPairs({ pairs, strategy: CSV_PHOTO_STRATEGY })

	const extra = failed.length ? ` (${failed.length} photo downloads failed.)` : ''
	return {
		inserted: created.length,
		message: `Imported ${created.length} CSV recipe(s).${extra}`
	}
}
