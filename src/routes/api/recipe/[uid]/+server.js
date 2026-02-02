import { prisma } from '$lib/server/prisma'
import { deleteSinglePhotoFile } from '$lib/utils/image/imageBackend.js'
import {
	checkImageExistence,
	getContentTypeFromUrl,
	mapContentTypeToFileTypeAndExtension
} from '$lib/utils/image/imageUtils.js'
import { processImage } from '$lib/utils/image/imageBackend.js'
import { createRecipePhotoEntry, removeRecipePhotoEntry } from '$lib/utils/api'
import { saveFile, validImageTypes } from '$lib/utils/import/importHelpers'
import { fileTypeFromBuffer } from 'file-type'
import {
	requireAuth,
	requireOwnership,
	getOptionalUser,
	jsonSuccess,
	jsonError
} from '$lib/server/authHelpers'

export async function DELETE({ params, locals }) {
	const user = requireAuth(locals)
	const { uid } = params

	try {
		const recipe = await prisma.recipe.findUnique({
			where: { uid }
		})

		requireOwnership(user, recipe)

		const photos = await prisma.recipePhoto.findMany({
			where: { recipeUid: uid }
		})

		for (const photo of photos) {
			deleteSinglePhotoFile(photo.id, photo.fileType)
		}

		await prisma.recipe.delete({
			where: { uid }
		})

		return jsonSuccess({ message: 'Recipe deleted successfully', uid })
	} catch (err) {
		if (err.status) throw err
		return jsonError(500, `Failed to delete recipe: ${err.message}`)
	}
}

export async function PUT({ request, locals, params, url }) {
	const user = requireAuth(locals)
	const formData = await request.formData()
	const recipeData = JSON.parse(formData.get('recipe'))
	const imageData = formData.getAll('images')
	const { uid } = params

	recipeData.cook_time = recipeData.cook_time ? recipeData.cook_time.toString() : null
	recipeData.prep_time = recipeData.prep_time ? recipeData.prep_time.toString() : null
	recipeData.total_time = recipeData.total_time ? recipeData.total_time.toString() : null
	recipeData.servings = recipeData.servings ? recipeData.servings.toString() : null

	const recipeCategories = recipeData.categories || []
	delete recipeData.categories

	// eslint-disable-next-line no-unused-vars
	const recipePhotos = recipeData.photos || []
	delete recipeData.photos

	const saveImageUrl = recipeData.saveImageUrl || false

	// Allowlist of fields that can be updated
	const allowedFields = [
		'name',
		'description',
		'source',
		'source_url',
		'cook_time',
		'prep_time',
		'total_time',
		'servings',
		'ingredients',
		'ingredients_original',
		'directions',
		'directions_original',
		'notes',
		'image_url',
		'photo_url',
		'photo',
		'photo_large',
		'nutritional_info',
		'difficulty',
		'rating',
		'scale',
		'is_public',
		'is_pinned',
		'in_trash',
		'on_favorites',
		'on_grocery_list',
		'parentRecipeId'
	]

	const updates = Object.fromEntries(
		Object.entries(recipeData).filter(([key]) => allowedFields.includes(key))
	)

	try {
		const recipe = await prisma.recipe.findUnique({
			where: { uid }
		})

		requireOwnership(user, recipe)

		await prisma.recipe.update({
			where: { uid },
			data: updates
		})

		let photoEntry

		// Loop through the uploaded images and save them
		for (const file of imageData) {
			try {
				let extension = mapContentTypeToFileTypeAndExtension(file.type).extension
				photoEntry = await createRecipePhotoEntry(recipe.uid, null, extension)
				const photoFilename = photoEntry.id
				const photoBuffer = await file.arrayBuffer() // Get the image data as a buffer

				// Validate the file type of the image
				const fileTypeResult = await fileTypeFromBuffer(photoBuffer)
				if (!fileTypeResult || !validImageTypes.includes(fileTypeResult.ext)) {
					throw new Error('Invalid image type.')
				}

				// Specify the directory where you want to save the images
				const directory = 'uploads/images'

				let fullFilename = `${photoFilename}.${extension}`
				// Call the saveFile function to save the image
				await saveFile(photoBuffer, fullFilename, directory)
			} catch (err) {
				console.log('Error Saving Photo! Deleting Photo Entry!', err)
				removeRecipePhotoEntry(photoEntry.id)
			}
		}

		// Process remote image_url if user opted to save
		if (saveImageUrl && recipeData.image_url) {
			const existingPhoto = await prisma.recipePhoto.findFirst({
				where: { recipeUid: uid, url: recipeData.image_url }
			})
			if (!existingPhoto && (await checkImageExistence(recipeData.image_url, url.origin))) {
				// Only set as main if there's no existing main photo
				const hasMainPhoto = await prisma.recipePhoto.findFirst({
					where: { recipeUid: uid, isMain: true }
				})
				const contentType = await getContentTypeFromUrl(recipeData.image_url)
				const { extension } = mapContentTypeToFileTypeAndExtension(contentType)
				let remotePhotoEntry
				try {
					remotePhotoEntry = await createRecipePhotoEntry(uid, recipeData.image_url, extension, !hasMainPhoto)
					await processImage(recipeData.image_url, remotePhotoEntry.id, extension)
				} catch (error) {
					console.error('Error saving remote image:', error)
					if (remotePhotoEntry) {
						await removeRecipePhotoEntry(remotePhotoEntry.id)
					}
				}
			}
		}

		// First, remove all existing associations
		await prisma.recipeCategory.deleteMany({
			where: {
				recipeUid: uid
			}
		})

		// Then, add the new associations
		for (let categoryUid of recipeCategories) {
			await prisma.recipeCategory.create({
				data: {
					recipeUid: uid,
					categoryUid: categoryUid
				}
			})
		}

		return jsonSuccess({ message: 'Recipe updated successfully' })
	} catch (err) {
		if (err.status) throw err
		console.error('Error updating recipe:', err)
		return jsonError(500, `Failed to update recipe: ${err.message}`)
	}
}

export async function GET({ params, locals }) {
	const user = getOptionalUser(locals)
	const { uid } = params

	try {
		const recipe = await prisma.recipe.findUnique({
			where: { uid },
			include: {
				photos: {
					select: {
						id: true,
						url: true,
						fileType: true,
						isMain: true,
						notes: true
					}
				},
				categories: true,
				parentRecipe: {
					select: {
						uid: true,
						name: true
					}
				}
			}
		})

		if (!recipe) {
			return jsonError(404, 'Recipe not found!')
		}

		// Check access: public recipes are accessible to all, private only to owner/admin
		if (!recipe.is_public) {
			if (!user) {
				return jsonError(401, 'User not authenticated and recipe private.')
			}
			if (recipe.userId !== user.userId && !user.isAdmin) {
				return jsonError(403, 'Unauthorised!')
			}
		}

		let favourited = false
		let duplicatedByViewer = false
		if (user) {
			const fav = await prisma.recipeFavorite.findUnique({
				where: {
					userId_recipeUid: {
						userId: user.userId,
						recipeUid: uid
					}
				}
			})
			favourited = !!fav

			const fork = await prisma.recipe.findFirst({
				where: {
					userId: user.userId,
					parentRecipeId: uid
				},
				select: { uid: true }
			})
			duplicatedByViewer = !!fork
		}

		return jsonSuccess({ ...recipe, on_favorites: favourited, duplicatedByViewer })
	} catch (err) {
		return jsonError(500, `Failed to fetch recipe: ${err.message}`)
	}
}
