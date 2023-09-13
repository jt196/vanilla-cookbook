import { prisma } from '$lib/server/prisma'
import { fail, redirect } from '@sveltejs/kit'
import { parseURL } from '$lib/utils/parse/recipeParse'
import {
	checkImageExistence,
	getContentTypeFromUrl,
	mapContentTypeToFileTypeAndExtension
} from '$lib/utils/image/imageUtils'
import {
	createRecipePhotoEntry,
	removeRecipePhotoEntry,
	processImage
} from '$lib/utils/image/imageBackend'

/**
 * @typedef {Object} Actions
 * @property {Function} createRecipe - Function to create a recipe.
 * @property {Function} scrapeRecipe - Function to scrape a recipe from a given URL.
 */

/**
 * Actions for creating and scraping recipes.
 * @type {Actions}
 */
export const actions = {
	// TODO: #42 Add photo when saving recipe
	createRecipe: async ({ request, locals, url }) => {
		const { session, user } = await locals.auth.validateUser()
		if (!session || !user) {
			throw redirect(302, '/')
		}

		const {
			name,
			description,
			source,
			source_url,
			cook_time,
			image_url,
			prep_time,
			ingredients,
			directions,
			total_time,
			servings,
			nutritional_info
		} = Object.fromEntries(await request.formData())
		let recipe
		try {
			recipe = await prisma.recipe.create({
				data: {
					name,
					description,
					source,
					source_url,
					cook_time,
					image_url,
					prep_time,
					ingredients,
					directions,
					total_time,
					servings,
					nutritional_info,
					created: new Date(),
					userId: user.userId
				}
			})
		} catch (err) {
			console.error(err)
			return fail(500, { message: 'Could not create the recipe.' })
		}
		// If the image URL exists, create an entry, download, resize, and save the image
		if (await checkImageExistence(image_url, url)) {
			console.log('Image exists, processing!')
			const contentType = await getContentTypeFromUrl(image_url)
			const { extension } = mapContentTypeToFileTypeAndExtension(contentType)

			let photoEntry
			try {
				photoEntry = await createRecipePhotoEntry(recipe.uid, image_url, extension)
				await processImage(image_url, photoEntry.id, extension)
			} catch (error) {
				console.error(error)
				if (photoEntry) {
					await removeRecipePhotoEntry(photoEntry.id)
				}
				return fail(500, { message: 'Failed to process the image.' })
			}
		}
		throw redirect(302, '/recipe')
	},
	scrapeRecipe: async ({ request, locals }) => {
		const { session, user } = await locals.auth.validateUser()
		if (!session || !user) {
			throw redirect(302, '/')
		}

		const { url } = Object.fromEntries(await request.formData())
		try {
			const recipeArrayText = JSON.stringify(await parseURL(url))
			return { body: recipeArrayText }
		} catch (err) {
			console.error(err)
			return fail(500, { message: 'Could not scrape the recipe.' })
		}
	}
}
