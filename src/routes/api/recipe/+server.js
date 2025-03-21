import { prisma } from '$lib/server/prisma'
import {
	checkImageExistence,
	getContentTypeFromUrl,
	mapContentTypeToFileTypeAndExtension
} from '$lib/utils/image/imageUtils'
import { processImage } from '$lib/utils/image/imageBackend'
import { createRecipePhotoEntry, removeRecipePhotoEntry } from '$lib/utils/api'

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

	const bodyText = await request.text()
	const recipeData = JSON.parse(bodyText)

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
				cook_time: cook_time ? cook_time.toString() : null, // Ensure cook_time is a string
				image_url,
				prep_time: prep_time ? prep_time.toString() : null, // Ensure prep_time is a string
				notes,
				ingredients,
				directions,
				total_time: total_time ? total_time.toString() : null, // Ensure total_time is a string
				servings: servings ? servings.toString() : null, // Use the string version of servings
				nutritional_info,
				is_public,
				created: new Date(),
				userId: user.userId
			}
		})
	} catch (err) {
		console.log('Error: ' + err)
		return new Response(
			{ err: `Failed to update recipe: ${err.message}` },
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}

	if (await checkImageExistence(image_url, url.origin)) {
		console.log('Image exists, processing!')
		const contentType = await getContentTypeFromUrl(image_url)
		const { extension } = mapContentTypeToFileTypeAndExtension(contentType)

		let photoEntry
		try {
			// Creating the main image on save - set to isMain
			photoEntry = await createRecipePhotoEntry(recipe.uid, image_url, extension, true)
			await processImage(image_url, photoEntry.id, extension)
		} catch (error) {
			console.error(error)
			if (photoEntry) {
				await removeRecipePhotoEntry(photoEntry.id)
			}
			return new Response(
				{ message: `Failed to process image` },
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
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
