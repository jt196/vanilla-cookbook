// Plain JS
import { Readable } from 'node:stream'
import csv from 'csv-parser'

import {
	mapListByConfig,
	isValidRecipeStructure,
	addRecipesToDB,
	pairByIndex
} from '$lib/utils/import/importHelpers.js'

import { importPhotosForPairs } from '$lib/utils/import/photoHelpers.js'

// 1) Parse CSV buffer (handles quoted newlines, etc.)
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

// 2) Field map: CSV headers -> DB Recipe
// Columns we care about (from your sample):
// Title, Description, Prep Time, Cook Time, Total Time, Servings, Yield,
// Ingredients, Directions, Rating, Url, Source, Photo Url,
// Created At, Updated At
const PTE_FIELD_MAP = {
	Title: 'name',
	Description: 'description',
	'Prep Time': 'prep_time',
	'Cook Time': 'cook_time',
	'Total Time': 'total_time',
	Servings: 'servings',
	Yield: 'servings', // fallback via transform
	Ingredients: 'ingredients',
	Directions: 'directions',
	Rating: 'rating',
	Url: 'source_url', // canonical source link
	Source: 'source', // free-text source label (kept separate)
	'Photo Url': 'image_url', // store the URL too
	'Created At': 'created', // transformed to Date
	'Updated At': 'created' // fallback if Created At missing
}

// 3) Transforms: dead simple
const PTE_TRANSFORMS = {
	Rating: (v) => {
		const n = parseFloat(String(v ?? '').replace(',', '.'))
		return Number.isFinite(n) ? n : null
	},
	// First non-empty sets created; later ones won't overwrite
	'Created At': (v, _src, out) => (out.created ??= new Date(v)),
	'Updated At': (v, _src, out) => (out.created ??= new Date(v)),
	// Servings fallback chain (stringify)
	Servings: (v) => (v != null && String(v).trim() !== '' ? String(v) : null),
	Yield: (v, _src, out) =>
		(out.servings ??= v != null && String(v).trim() !== '' ? String(v) : null)
}

// 4) Photo strategy: URL only
const PTE_PHOTO_STRATEGY = {
	urlOrder: ['photo_url', 'image_url']
}

export async function importPlanToEatFromBuffer({ buffer, userId, isPublic }) {
	const rows = await parseCsvBuffer(buffer)

	// Require Title
	const keep = rows.filter((r) => r.Title && String(r.Title).trim().length)
	if (!keep.length) return { inserted: 0, message: 'No valid rows (missing Title) found in CSV.' }

	// Map headers -> DB, inject flags + created fallback
	const parsed = mapListByConfig(keep, PTE_FIELD_MAP, PTE_TRANSFORMS, {
		is_public: !!isPublic
	}).map((row) => ({
		created: row.created ?? new Date(),
		...row
	}))

	if (!isValidRecipeStructure(parsed)) {
		throw new Error('Invalid recipe structure after CSV mapping.')
	}

	// Insert
	const created = await addRecipesToDB(parsed, userId)

	// Build raw objects for photo importer
	// We expose the CSV's Photo Url as both photo_url and image_url (strategy will use either).
	const rawForPhotos = keep.map((r) => ({
		name: r.Title,
		photo_url: r['Photo Url'] || null,
		image_url: r['Photo Url'] || null
	}))

	const pairs = pairByIndex(created, rawForPhotos)
	const failed = await importPhotosForPairs({ pairs, strategy: PTE_PHOTO_STRATEGY })
	const extra = failed.length ? ` (${failed.length} photo downloads failed.)` : ''

	return {
		inserted: created.length,
		message: `Imported ${created.length} PlanToEat recipe(s).${extra}`
	}
}
