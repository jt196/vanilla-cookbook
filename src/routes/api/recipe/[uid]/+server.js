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

	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		// Fetch the recipe's categories
		const recipeCategories = await prisma.reciperecipe.findMany({
			where: {
				recipeUid: uid
			},
			select: {
				recipe: true
			}
		})

		const categories = recipeCategories.map((rc) => ({ ...rc.recipe, selected: true }))

		const recipeSet = new Set()

		// Recursively fetch parent categories
		for (let recipe of categories) {
			let currentrecipe = recipe
			while (currentrecipe.parent_uid) {
				const parentrecipe = await prisma.recipe.findUnique({
					where: {
						uid: currentrecipe.parent_uid
					}
				})
				if (!parentrecipe) break // Stop if parent not found
				recipeSet.add({ ...parentrecipe, selected: false })
				currentrecipe = parentrecipe
			}
		}

		const uniqueCategories = [...categories, ...Array.from(recipeSet)]

		const hierarchicalCategories = buildHierarchy(uniqueCategories)

		// TODO: #41 Make this into a get categories function for reuse

		return new Response(JSON.stringify(hierarchicalCategories), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: `Failed to fetch categories: ${error.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
