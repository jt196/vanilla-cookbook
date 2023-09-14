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
export const POST = async ({ request, locals, params }) => {
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

	try {
		const recipe = await prisma.recipe.findUnique({
			where: { uid: uid }
		})

		if (!recipe) {
			return new Response('recipe not found!', {
				status: 404,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		if (recipe.userId !== user.userId) {
			return new Response('Unauthorised to update this recipe!', {
				status: 401,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		const updatedrecipe = await prisma.recipe.update({
			where: { uid: uid },
			data: {
				name: recipeData.name || recipe.name,
				parent_uid: 'parent_uid' in recipeData ? recipeData.parent_uid : recipe.parent_uid
			}
		})

		return new Response(JSON.stringify(updatedrecipe), {
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
	const { session, user } = await locals.auth.validateUser()
	const { uid } = params
	console.log('🚀 ~ file: +server.js:145 ~ GET ~ recipeId:', uid)

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
