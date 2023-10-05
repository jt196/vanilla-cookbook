import { gzip } from 'zlib'
import { promisify } from 'util'
import archiver from 'archiver'
import { sanitizeFilename } from '$lib/utils/filters.js'

function transformData(rawData) {
	return {
		uid: rawData.uid,
		created: new Date(rawData.created).toISOString().replace('T', ' ').split('.')[0], // Convert to the desired datetime format
		hash: rawData.hash,
		name: rawData.name,
		description: rawData.description || '', // If null, use empty string
		ingredients: rawData.ingredients.split('\r\n').join('\n'), // Convert all CRLF to LF
		directions: rawData.directions.split('\r\n').join('\n'), // Convert all CRLF to LF
		notes: rawData.notes || '', // If null, use empty string
		nutritional_info: rawData.nutritional_info.split('\r\n').join('\n'), // Convert all CRLF to LF
		prep_time: rawData.prep_time || '',
		cook_time: rawData.cook_time || '',
		total_time: rawData.total_time || '',
		difficulty: rawData.difficulty || '',
		servings: rawData.servings || '',
		rating: rawData.rating || 0,
		source: rawData.source || '',
		source_url: rawData.source_url || '',
		photo: null, // As per your instruction
		photo_large: null, // As per your instruction
		photo_hash: null,
		image_url: rawData.image_url || '',
		categories: rawData.categories.map((categoryObj) => categoryObj.category.name), // Transform categories array
		photos: []
	}
}

const gzipAsync = promisify(gzip)

async function createZipWithGzippedRecipes(recipeData) {
	const archive = archiver('zip')
	const buffers = []

	// This will collect data chunks of the zipped archive into the buffers array.
	archive.on('data', (data) => buffers.push(data))

	archive.on('warning', function (err) {
		if (err.code === 'ENOENT') {
			console.warn(err)
		} else {
			throw err
		}
	})

	archive.on('error', function (err) {
		throw err
	})

	archive.on('end', function () {
		console.log('Archive wrote %d bytes', archive.pointer())
	})

	const filenameOccurrences = new Map()

	function getUniqueFilename(name) {
		// Get current count (default to 0 if name hasn't been used yet)
		const count = filenameOccurrences.get(name) || 0

		// Update map with incremented count
		filenameOccurrences.set(name, count + 1)

		// If this is the first occurrence, return the name as it is
		if (count === 0) {
			return name
		}

		// If not, append the count to the name
		return `${name}-${count}`
	}

	for (const recipe of recipeData) {
		const transformedData = transformData(recipe)
		const jsonData = JSON.stringify(transformedData)
		const gzippedData = await gzipAsync(jsonData)
		let sanitizedRecipeName = sanitizeFilename(recipe.name || 'unknown') // Fall back to 'unknown' if name isn't provided
		sanitizedRecipeName = getUniqueFilename(sanitizedRecipeName) // Make it unique

		archive.append(gzippedData, { name: `${sanitizedRecipeName}.paprikarecipe` })
	}

	// Finalize the archive (important!)
	archive.finalize()

	return new Promise((resolve) => {
		archive.on('finish', function () {
			resolve(Buffer.concat(buffers))
		})
	})
}

export async function POST({ request }) {
	const bodyText = await request.text()
	const recipeData = JSON.parse(bodyText)
	try {
		const zipBuffer = await createZipWithGzippedRecipes(recipeData)

		return new Response(zipBuffer, {
			headers: {
				'Content-Disposition': 'attachment; filename=export.paprikarecipes.zip',
				'Content-Type': 'application/zip'
			}
		})
	} catch (err) {
		console.error('Error:', err)
		return new Response('Internal Server Error', {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
