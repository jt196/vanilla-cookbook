import { prisma } from '$lib/server/prisma'
import path from 'path'
import { promises as fsPromises } from 'fs'

// Handle delete request
export async function DELETE({ params, locals }) {
	const { session, user } = await locals.auth.validateUser()
	const { uid } = params

	if (!session || !user) {
		console.log('User Not Authenticated!')
		return new Response('User not authenticated', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	const recipe = await prisma.recipe.findUniqueOrThrow({
		where: {
			uid
		}
	})

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
			const photoPath = path.join('static/recipe_photos/', photo.id + '.' + photo.fileType)
			try {
				await fsPromises.unlink(photoPath)
			} catch (err) {
				console.error(`Failed to delete photo at ${photoPath}`, err)
			}
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
	const { session, user } = await locals.auth.validateUser()
	const bodyText = await request.text()
	const recipeData = JSON.parse(bodyText)
	const { uid } = params

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
		console.log('🚀 ~ file: +server.js:152 ~ POST ~ error:', error)
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
	const { session, user } = await locals.auth.validateUser()
	const { uid } = params

	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		const recipe = await prisma.recipe.findUnique({
			where: {
				uid: uid
			},
			include: {
				photos: {
					select: {
						id: true,
						fileType: true,
						isMain: true
					}
				},
				categories: true
			}
		})
		if (!recipe) {
			return new Response(JSON.stringify({ error: 'Recipe not found!' }), {
				status: 404,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}
		if (recipe.userId !== user.userId) {
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
