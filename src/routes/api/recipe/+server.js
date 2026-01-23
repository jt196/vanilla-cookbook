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

export async function POST({ request, locals, url }) {
	const session = await locals.auth.validate()
	const user = session?.user

	if (!session || !user) {
		console.log('User not authenticated!')
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	const formData = await request.formData()
	const recipeData = JSON.parse(formData.get('recipe'))
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
		is_public
	} = recipeData

	let recipe
	try {
		recipe = await prisma.recipe.create({
			data: {
				name,
				description,
				source,
				source_url,
				cook_time: cook_time ? cook_time.toString() : null,
				image_url,
				prep_time: prep_time ? prep_time.toString() : null,
				notes,
				ingredients,
				directions,
				total_time: total_time ? total_time.toString() : null,
				servings: servings ? servings.toString() : null,
				nutritional_info,
				is_public,
				created: new Date(),
				userId: user.userId
			}
		})
	} catch (err) {
		console.log('Error: ' + err)
		return new Response(
			JSON.stringify({ error: `Failed to create recipe: ${err.message}` }),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}

	// Process remote image_url if it exists
	if (await checkImageExistence(image_url, url.origin)) {
		console.log('Image exists, processing!')
		const contentType = await getContentTypeFromUrl(image_url)
		const { extension } = mapContentTypeToFileTypeAndExtension(contentType)

		let photoEntry
		try {
			photoEntry = await createRecipePhotoEntry(recipe.uid, image_url, extension, true)
			await processImage(image_url, photoEntry.id, extension)
		} catch (error) {
			console.error(error)
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
			console.log('Error saving photo! Deleting photo entry!', err)
			if (photoEntry) {
				removeRecipePhotoEntry(photoEntry.id)
			}
		}
	}

	return new Response(
		JSON.stringify({
			uid: recipe.uid
		}),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		}
	)
}
