import {
	openZipFromBuffer,
	readZipEntryBuffer,
	mapListByConfig,
	pairByIndex,
	isValidRecipeStructure,
	addRecipesToDB
} from '$lib/utils/import/importHelpers.js'
import { importPhotosForPairs } from '$lib/utils/import/photoHelpers.js'
import { parse } from 'node-html-parser'
import he from 'he'

// ---------- tiny html helpers ----------
const txt = (n) => (n ? he.decode(String(n.text || n.textContent || '').trim()) : '')
const manyPToLines = (root) =>
	Array.from(root?.querySelectorAll('p') || [])
		.map((p) => txt(p))
		.filter(Boolean)

// ---------- extraction ----------
async function extractRecipeKeeperFromZipBuffer(buffer) {
	const directory = await openZipFromBuffer(buffer)

	// find the single recipes.html (root or nested)
	const htmlEntry = directory.files.find((f) => /(^|\/)recipes\.html$/i.test(f.path))
	if (!htmlEntry) throw new Error('RecipeKeeper: recipes.html not found in zip.')

	const html = (await readZipEntryBuffer(htmlEntry)).toString('utf-8')
	const root = parse(html)

	// for resolving image src -> zip entry
	const getImageBase64 = async (src) => {
		if (!src) return null
		// normalize to forward slashes & trim leading "./"
		let path = src.replace(/\\/g, '/').replace(/^\.\//, '')
		// most exports use "images/xxx.jpg" next to recipes.html
		const file = directory.files.find((f) => f.path.toLowerCase() === path.toLowerCase())
		if (!file) return null
		const buf = await readZipEntryBuffer(file)
		return { filename: path.split('/').pop(), data: buf.toString('base64') }
	}

	const blocks = root.querySelectorAll('.recipe-details')
	if (!blocks.length) throw new Error('RecipeKeeper: no .recipe-details blocks found.')

	const raws = []
	for (const block of blocks) {
		const name = txt(block.querySelector('h2[itemprop="name"]'))
		if (!name) continue

		// times (ISO8601 in <meta content="PTxx">)
		const prepISO =
			block.querySelector('meta[itemprop="prepTime"]')?.getAttribute('content') || null
		const cookISO =
			block.querySelector('meta[itemprop="cookTime"]')?.getAttribute('content') || null

		// servings
		const servings = txt(block.querySelector('[itemprop="recipeYield"]')) || null

		// rating & favourite
		const ratingRaw =
			block.querySelector('meta[itemprop="recipeRating"]')?.getAttribute('content') ?? null
		const rating = ratingRaw != null ? parseFloat(String(ratingRaw).replace(',', '.')) : null

		const favRaw =
			block.querySelector('meta[itemprop="recipeIsFavourite"]')?.getAttribute('content') ?? ''
		const on_favorites = /^true$/i.test(String(favRaw).trim())

		// source URL (anchor inside [itemprop="recipeSource"])
		const source_url =
			block.querySelector('[itemprop="recipeSource"] a')?.getAttribute('href') ||
			txt(block.querySelector('[itemprop="recipeSource"]')) ||
			null

		// ingredients / directions / notes (join <p> blocks)
		const ingredients = manyPToLines(block.querySelector('.recipe-ingredients')).join('\n') || null
		const directions =
			manyPToLines(block.querySelector('[itemprop="recipeDirections"]'))
				.filter(Boolean)
				.join('\n\n') || null
		const notes =
			manyPToLines(block.querySelector('.recipe-notes')).filter(Boolean).join('\n') || null

		// photos: primary from <img.recipe-photo>, others from “Photos” section
		const primarySrc = block.querySelector('img.recipe-photo')?.getAttribute('src') || null
		let photo = null
		let photo_data = null
		const photos = []

		if (primarySrc) {
			const main = await getImageBase64(primarySrc)
			if (main) {
				photo = main.filename
				photo_data = main.data // base64
			}
		}

		const thumbs = block.querySelectorAll('.recipe-photos-div img')
		for (const t of thumbs) {
			const src = t.getAttribute('src')
			const obj = await getImageBase64(src)
			if (obj) photos.push(obj)
		}

		raws.push({
			name,
			ingredients,
			directions,
			notes,
			source_url,
			prep_time: prepISO,
			cook_time: cookISO,
			total_time: null,
			servings,
			rating,
			on_favorites,
			// images for strategy
			photo,
			photo_data,
			photos, // [{ filename, data }]
			// reasonable defaults for your schema
			description: null,
			created: new Date().toISOString(),
			image_url: null,
			photo_url: null,
			on_grocery_list: false,
			is_pinned: false,
			in_trash: false,
			scale: null,
			hash: null,
			difficulty: null,
			nutritional_info: null
		})
	}

	if (!isValidRecipeStructure(raws)) throw new Error('Invalid recipe structure.')
	return raws
}

// ---------- map + transforms ----------
const RK_FIELD_MAP = {
	name: 'name',
	description: 'description',
	ingredients: 'ingredients',
	directions: 'directions',
	notes: 'notes',
	source_url: 'source_url',
	prep_time: 'prep_time',
	cook_time: 'cook_time',
	total_time: 'total_time',
	servings: 'servings',
	rating: 'rating',
	on_favorites: 'on_favorites',
	created: 'created',
	image_url: 'image_url',
	photo_url: 'photo_url',
	on_grocery_list: 'on_grocery_list',
	is_pinned: 'is_pinned',
	in_trash: 'in_trash',
	scale: 'scale',
	hash: 'hash',
	difficulty: 'difficulty',
	nutritional_info: 'nutritional_info'
}

const RK_TRANSFORMS = {
	created: (v) => (v ? new Date(v) : new Date())
}

// prefer embedded base64; include additional list if present
const RK_PHOTO_STRATEGY = {
	base64Main: { filenameKey: 'photo', dataKey: 'photo_data' },
	base64List: { listKey: 'photos', filenameKey: 'filename', dataKey: 'data' },
	urlOrder: ['photo_url', 'image_url'] // just in case
}

// ---------- main ----------
export async function importRecipeKeeperFromBuffer({ buffer, userId, isPublic }) {
	const raw = await extractRecipeKeeperFromZipBuffer(buffer)
	if (!raw?.length) return { inserted: 0, message: 'No recipes found.' }

	const parsed = mapListByConfig(raw, RK_FIELD_MAP, RK_TRANSFORMS, {
		is_public: !!isPublic
	})

	const created = await addRecipesToDB(parsed, userId)

	const pairs = pairByIndex(created, raw)
	const failed = await importPhotosForPairs({ pairs, strategy: RK_PHOTO_STRATEGY })
	const extra = failed.length ? ` (${failed.length} photo imports failed.)` : ''

	return {
		inserted: created.length,
		message: `Imported ${created.length} Recipe Keeper recipe(s).${extra}`
	}
}
