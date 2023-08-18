import unzipper from 'unzipper'
import zlib from 'zlib'

export async function extractRecipes(zipFilePath) {
	const recipes = []

	const directory = await unzipper.Open.file(zipFilePath)

	const processEntry = (entry) => {
		return new Promise((resolve, reject) => {
			if (entry.path.endsWith('.paprikarecipe')) {
				const chunks = []
				const readStream = entry.stream()

				readStream.on('data', (chunk) => chunks.push(chunk))
				readStream.on('end', () => {
					const buffer = Buffer.concat(chunks)

					// Decompress the gzip data
					zlib.gunzip(buffer, (err, decompressedBuffer) => {
						if (err) {
							console.error(`Error decompressing ${entry.path}:`, err)
							reject(err)
							return
						}

						try {
							const recipeJson = JSON.parse(decompressedBuffer.toString('utf8'))
							recipes.push(recipeJson)
							resolve()
						} catch (e) {
							console.error(`Error parsing JSON for ${entry.path}:`, e)
							reject(e)
						}
					})
				})
			} else {
				resolve()
			}
		})
	}

	const promises = directory.files.map(processEntry)
	await Promise.all(promises)

	return recipes
}

// Filter the recipe JSON to correspond to existing fields in the database
export function filterRecipeData(recipe) {
	const allowedFields = [
		'uid',
		'userId',
		'rating',
		'photo_hash',
		'on_favorites',
		'photo',
		'scale',
		'ingredients',
		'is_pinned',
		'source',
		'total_time',
		'hash',
		'description',
		'source_url',
		'difficulty',
		'on_grocery_list',
		'in_trash',
		'directions',
		'photo_url',
		'cook_time',
		'name',
		'created',
		'notes',
		'photo_large',
		'image_url',
		'prep_time',
		'servings',
		'nutritional_info'
	]

	return Object.keys(recipe)
		.filter((key) => allowedFields.includes(key))
		.reduce((obj, key) => {
			obj[key] = recipe[key]
			return obj
		}, {})
}
