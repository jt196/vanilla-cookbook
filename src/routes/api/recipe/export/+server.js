// src/routes/api/recipe/export/+server.js
import { gzip } from 'zlib'
import { promisify } from 'util'
import archiver from 'archiver'
import fs from 'fs'
import path from 'path'
import { sanitizeFilename } from '$lib/utils/filters.js'
import { prisma } from '$lib/server/prisma'

// if you already have uploadDir in a helper, reuse it. Otherwise:
import { uploadDir } from '$lib/utils/import/importHelpers.js' // points to appRoot/uploads/images

const gzipAsync = promisify(gzip)

// Merge in photo fields if we have them
function transformData(rawData, photoExtras = {}) {
	return {
		uid: rawData.uid,
		created: new Date(rawData.created).toISOString().replace('T', ' ').split('.')[0] || '',
		hash: rawData.hash,
		name: rawData.name,
		description: rawData.description || '',
		ingredients:
			typeof rawData.ingredients === 'string' ? rawData.ingredients.split('\r\n').join('\n') : '',
		directions:
			typeof rawData.directions === 'string' ? rawData.directions.split('\r\n').join('\n') : '',
		notes: rawData.notes || '',
		nutritional_info:
			typeof rawData.nutritional_info === 'string'
				? rawData.nutritional_info.split('\r\n').join('\n')
				: '',
		prep_time: rawData.prep_time || '',
		cook_time: rawData.cook_time || '',
		total_time: rawData.total_time || '',
		difficulty: rawData.difficulty || '',
		servings: rawData.servings || '',
		rating: rawData.rating || 0,
		source: rawData.source || '',
		source_url: rawData.source_url || '',
		// photo fields get injected below
		image_url: rawData.image_url || '',
		categories:
			rawData.categories && Array.isArray(rawData.categories)
				? rawData.categories.map((c) => c.category.name)
				: [],
		photos: [],
		...photoExtras // <- injects { photo, photo_data, photo_large, photo_hash }
	}
}

async function embedMainPhotoFields(recipe) {
	// Pick main first; else first photo if none marked
	const main = (recipe.photos || []).find((p) => p.isMain) || (recipe.photos || [])[0]

	if (!main) {
		return { photo: null, photo_data: null, photo_large: null, photo_hash: null }
	}

	const ext = main.fileType || 'jpg'
	const filename = `${main.id}.${ext}`
	const filePath = path.join(uploadDir, filename)

	try {
		const buf = await fs.promises.readFile(filePath)
		return {
			photo: filename, // Paprika expects a filename
			photo_data: buf.toString('base64'), // and base64 data
			photo_large: null,
			photo_hash: null
		}
	} catch {
		// If the file isn't present locally, skip embedding
		return { photo: null, photo_data: null, photo_large: null, photo_hash: null }
	}
}

async function createZipWithGzippedRecipes(recipeData) {
	const archive = archiver('zip')
	const buffers = []

	archive.on('data', (d) => buffers.push(d))
	archive.on('warning', (err) => {
		if (err.code !== 'ENOENT') throw err
	})
	archive.on('error', (err) => {
		throw err
	})

	const filenameOccurrences = new Map()
	function getUniqueFilename(name) {
		const count = filenameOccurrences.get(name) || 0
		filenameOccurrences.set(name, count + 1)
		return count === 0 ? name : `${name}-${count}`
	}

	for (const recipe of recipeData) {
		const photoExtras = await embedMainPhotoFields(recipe)
		const transformedData = transformData(recipe, photoExtras)

		const jsonData = JSON.stringify(transformedData)
		const gzippedData = await gzipAsync(jsonData)

		let sanitized = sanitizeFilename(recipe.name || 'unknown')
		sanitized = getUniqueFilename(sanitized)

		// One gzipped .paprikarecipe per recipe inside the zip
		archive.append(gzippedData, { name: `${sanitized}.paprikarecipe` })
	}

	archive.finalize()

	return new Promise((resolve) => {
		archive.on('finish', () => resolve(Buffer.concat(buffers)))
	})
}

export async function POST({ locals }) {
	const session = await locals.auth.validate()
	const user = session?.user
	if (!session || !user) {
		return new Response('User not authenticated', {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	try {
		const recipes = await prisma.recipe.findMany({
			where: { userId: user.userId },
			orderBy: { created: 'desc' },
			include: {
				categories: {
					select: { category: { select: { name: true, uid: true } } }
				},
				photos: {
					select: { id: true, fileType: true, isMain: true, url: true }
				}
			}
		})

		const zipBuffer = await createZipWithGzippedRecipes(recipes)

		return new Response(zipBuffer, {
			headers: {
				// Use the Paprika convention extension:
				'Content-Disposition': 'attachment; filename=export.paprikarecipes',
				'Content-Type': 'application/zip'
			}
		})
	} catch (err) {
		console.error('Error:', err)
		return new Response('Internal Server Error', {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}
