import { prisma } from '$lib/server/prisma'
import { deleteSinglePhotoFile } from '$lib/utils/image/imageBackend.js'
import { mapContentTypeToFileTypeAndExtension } from '$lib/utils/image/imageUtils.js'
import { createRecipePhotoEntry, removeRecipePhotoEntry } from '$lib/utils/api'
import { saveFile, validImageTypes } from '$lib/utils/import/files.js'
import { fileTypeFromBuffer } from 'file-type'

// Handle delete request
export async function DELETE({ params, locals }) {
	const session = await locals.auth.validate()
	const user = session?.user
	const { uid } = params

	const recipe = await prisma.recipe.findUniqueOrThrow({
		where: {
			uid
		}
	})

	if (!session || !user) {
		console.log('User Not Authenticated!')
		return new Response('User not authenticated', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	if (!recipe || recipe.userId !== user.userId) {
		return new Response('Unauthorized to delete this recipe.', {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
	try {
		// 1. Fetch the associated RecipePhoto entries for the recipe
		const photos = await prisma.recipePhoto.findMany({
			where: {
				recipeUid: uid
			}
		})
		// 2. Delete the images from the file system
		for (const photo of photos) {
			deleteSinglePhotoFile(photo.id, photo.fileType)
		}
		await prisma.recipe.delete({
			where: { uid }
		})
		return new Response(
			{ message: 'recipe deleted successfully', uid: uid },
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	} catch (error) {
		return new Response(
			{ error: `Failed to delete recipe: ${error.message}` },
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}
}

// Handle post request to update an existing recipe
// API Endpoint: /api/recipe/[uid].js

export async function PUT({ request, locals, params }) {
	const session = await locals.auth.validate()
	const user = session?.user
	const formData = await request.formData()
	// Retrieve and parse the 'recipe' field from the FormData
	const recipeData = JSON.parse(formData.get('recipe'))
	const imageData = formData.getAll('images')

	// Now you have the 'recipe' data as an object
	// console.log('Recipe Data:', recipeData)

	const { uid } = params

	// Parse fields fields directly in recipeData
	recipeData.cook_time = recipeData.cook_time ? recipeData.cook_time.toString() : null
	recipeData.prep_time = recipeData.prep_time ? recipeData.prep_time.toString() : null
	recipeData.total_time = recipeData.total_time ? recipeData.total_time.toString() : null
	recipeData.servings = recipeData.servings ? recipeData.servings.toString() : null

	if (!session || !user) {
		return new Response('User not authenticated!', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	const recipeCategories = recipeData.categories || []
	delete recipeData.categories // Remove the categories key from the main data object

	// eslint-disable-next-line no-unused-vars
	const recipePhotos = recipeData.photos || []
	delete recipeData.photos // Remove the photos key from the main data object

	try {
		const recipe = await prisma.recipe.findUnique({
			where: { uid: uid }
		})

		if (!recipe) {
			console.log('Recipe not found!')
			return new Response('Recipe not found!', {
				status: 404,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		if (recipe.userId !== user.userId) {
			console.log('Unauthorised!')
			return new Response('Unauthorized to update this recipe!', {
				status: 401,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		await prisma.recipe.update({
			where: { uid: uid },
			data: recipeData
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

		return new Response(JSON.stringify({ message: 'Recipe updated successfully' }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(
			{ error: `Failed to update recipe: ${error.message}` },
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}
}

// Handle GET request
export async function GET({ params, locals }) {
	const session = await locals.auth.validate()
	const user = session?.user
	const { uid } = params

	try {
		const recipe = await prisma.recipe.findUnique({
			where: {
				uid: uid
			},
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
				categories: true
			}
		})

		if (!recipe.is_public && (!session || !user)) {
			return new Response(JSON.stringify({ error: 'User not authenticated and recipe private.' }), {
				status: 401,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		if (!recipe) {
			return new Response(JSON.stringify({ error: 'Recipe not found!' }), {
				status: 404,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}
		if (!recipe.is_public && recipe.userId !== user.userId) {
			console.log('Unauthorised!')
			return new Response(JSON.stringify({ error: 'Unauthorised!' }), {
				status: 403,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}
		// TODO: #41 Make this into a get categories function for reuse

		return new Response(JSON.stringify(recipe), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: `Failed to fetch recipe: ${error.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
