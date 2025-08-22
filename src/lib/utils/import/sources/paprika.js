import {
	openZipFromBuffer,
	findZipEntries,
	readZipEntryBuffer,
	gunzipToString,
	mapListByConfig,
	toDateSafe,
	preInsertDedupe,
	pairByIndex,
	defaultRecipeKey,
	isValidRecipeStructure,
	addRecipesToDB
} from '$lib/utils/import/importHelpers.js'
import { prisma } from '$lib/server/prisma'
import { importPhotosForPairs } from '$lib/utils/import/photoHelpers.js'

/** Paprika zip -> array of raw recipe JSONs (reads *.paprikarecipe gzip members) */
async function extractPaprikaRecipesFromZipBuffer(buffer) {
	const directory = await openZipFromBuffer(buffer)
	const entries = findZipEntries(directory, (f) => f.path.endsWith('.paprikarecipe'))
	if (!entries.length) throw new Error('No .paprikarecipe files found in archive.')

	const recipes = []
	for (const entry of entries) {
		const gz = await readZipEntryBuffer(entry)
		const json = await gunzipToString(gz)
		recipes.push(JSON.parse(json))
	}

	if (!isValidRecipeStructure(recipes)) throw new Error('Invalid recipe structure.')
	return recipes
}

/** Field mapping (Paprika -> Recipe) */
const PAPRIKA_FIELD_MAP = {
	rating: 'rating',
	photo_hash: 'photo_hash',
	on_favorites: 'on_favorites',
	photo: 'photo',
	scale: 'scale',
	ingredients: 'ingredients',
	is_pinned: 'is_pinned',
	source: 'source',
	total_time: 'total_time',
	hash: 'hash', // keep incoming hash if present
	description: 'description',
	source_url: 'source_url',
	difficulty: 'difficulty',
	on_grocery_list: 'on_grocery_list',
	in_trash: 'in_trash',
	directions: 'directions',
	photo_url: 'photo_url',
	cook_time: 'cook_time',
	name: 'name',
	created: 'created',
	notes: 'notes',
	photo_large: 'photo_large',
	image_url: 'image_url',
	prep_time: 'prep_time',
	servings: 'servings',
	nutritional_info: 'nutritional_info'
}
const PAPRIKA_TRANSFORMS = { created: (v) => toDateSafe(v) }

/** Local photo strategy (Paprika-specific) */
const PAPRIKA_PHOTO_STRATEGY = {
	base64Main: { filenameKey: 'photo', dataKey: 'photo_data' },
	base64List: { listKey: 'photos', filenameKey: 'filename', dataKey: 'data' },
	urlOrder: ['photo_url', 'image_url']
}

export async function importPaprikaFromBuffer({ buffer, userId, isPublic }) {
	// 1) read raw recipes
	const raw = await extractPaprikaRecipesFromZipBuffer(buffer)
	if (!raw?.length) return { inserted: 0, message: 'No recipes found.' }

	// 2) pre-insert de-dupe (prefer Paprika hash; fallback to fingerprint)
	const keyOf = (r) => r.hash || defaultRecipeKey(r)
	const { rawNew, keysNew } = await preInsertDedupe({
		raw,
		keyOf,
		findExisting: async (keySet) => {
			const keys = Array.from(keySet)
			if (!keys.length) return new Set()
			const exist = await prisma.recipe.findMany({
				where: { userId, hash: { in: keys } },
				select: { hash: true }
			})
			return new Set(exist.map((r) => r.hash))
		}
	})
	if (!rawNew.length) return { inserted: 0, message: 'All recipes already in the database.' }

	// 3) map fields + inject flags and ensure .hash exists
	const parsed = mapListByConfig(rawNew, PAPRIKA_FIELD_MAP, PAPRIKA_TRANSFORMS, {
		is_public: !!isPublic
	}).map((row, i) => ({ ...row, hash: row.hash || keysNew[i] }))

	// 4) insert (order preserved)
	const created = await addRecipesToDB(parsed, userId)

	// 5) pair created ↔ rawNew by index and import photos
	const pairs = pairByIndex(created, rawNew)
	const failed = await importPhotosForPairs({ pairs, strategy: PAPRIKA_PHOTO_STRATEGY })
	const extra = failed.length ? ` (${failed.length} photo sets failed.)` : ''

	return {
		inserted: created.length,
		message: `Imported ${created.length} recipe(s).${extra}`
	}
}
