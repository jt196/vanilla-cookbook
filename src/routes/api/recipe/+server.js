import { prisma } from '$lib/server/prisma'
import {
	checkImageExistence,
	getContentTypeFromUrl,
	mapContentTypeToFileTypeAndExtension
} from '$lib/utils/image/imageUtils'
import { processImage } from '$lib/utils/image/imageBackend'
import { createRecipePhotoEntry, removeRecipePhotoEntry } from '$lib/utils/api'
import { saveFile, validImageTypes } from '$lib/utils/import/importHelpers'
import { fileTypeFromBuffer } from 'file-type'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { normalizeToString } from '$lib/utils/normalize'

export async function POST({ request, locals, url }) {
	const user = requireAuth(locals)

	const formData = await request.formData()
	let recipeData
	try {
		const rawRecipe = formData.get('recipe')
		recipeData = JSON.parse(rawRecipe)
	} catch (err) {
		console.error('Failed to parse recipe payload', {
			userId: user?.userId,
			error: err?.message
		})
		return jsonError(400, 'Invalid recipe payload')
	}
	const imageData = formData.getAll('images')

	const {
		name,
		description,
		source,
		source_url,
		cook_time,
		image_url,
		prep_time,
		notes,
		ingredients,
		directions,
		total_time,
		servings,
		nutritional_info,
		is_public,
		saveImageUrl = true
	} = recipeData

	let recipe
	try {
		recipe = await prisma.recipe.create({
			data: {
				name,
				description,
				source,
				source_url,
				cook_time: normalizeToString(cook_time),
				image_url,
				prep_time: normalizeToString(prep_time),
				notes,
				ingredients,
				directions,
				total_time: normalizeToString(total_time),
				servings: normalizeToString(servings),
				nutritional_info,
				is_public,
				created: new Date(),
				userId: user.userId
			}
		})
	} catch (err) {
		console.error('Failed to create recipe', {
			userId: user?.userId,
			name,
			source,
			source_url,
			error: err?.message
		})
		return jsonError(500, `Failed to create recipe: ${err.message}`)
	}

	// Process remote image_url if it exists and user opted to save
	if (saveImageUrl && (await checkImageExistence(image_url, url.origin))) {
		console.log('Image exists, processing!')
		const contentType = await getContentTypeFromUrl(image_url)
		const { extension } = mapContentTypeToFileTypeAndExtension(contentType)

		let photoEntry
		try {
			photoEntry = await createRecipePhotoEntry(recipe.uid, image_url, extension, true)
			await processImage(image_url, photoEntry.id, extension)
		} catch (error) {
			console.error('Failed to process remote image', {
				userId: user?.userId,
				recipeUid: recipe?.uid,
				image_url,
				error: error?.message
			})
			if (photoEntry) {
				await removeRecipePhotoEntry(photoEntry.id)
			}
		}
	}

	// Process uploaded image files
	for (const file of imageData) {
		let photoEntry
		try {
			const extension = mapContentTypeToFileTypeAndExtension(file.type).extension
			photoEntry = await createRecipePhotoEntry(recipe.uid, null, extension)
			const photoBuffer = await file.arrayBuffer()

			const fileTypeResult = await fileTypeFromBuffer(photoBuffer)
			if (!fileTypeResult || !validImageTypes.includes(fileTypeResult.ext)) {
				throw new Error('Invalid image type.')
			}

			const directory = 'uploads/images'
			const fullFilename = `${photoEntry.id}.${extension}`
			await saveFile(photoBuffer, fullFilename, directory)
		} catch (err) {
			console.error('Error saving photo, deleting photo entry', {
				userId: user?.userId,
				recipeUid: recipe?.uid,
				error: err?.message
			})
			if (photoEntry) {
				removeRecipePhotoEntry(photoEntry.id)
			}
		}
	}

	return jsonSuccess({ uid: recipe.uid })
}
