import { prisma } from '$lib/server/prisma'

// Handle post request to update an existing recipe
// API Endpoint: /api/recipe/[uid].js

export async function PUT({ locals, params }) {
	const session = await locals.auth.validate()
	const user = session?.user

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
			data: {
				on_favorites: !recipe.on_favorites
			}
		})

		return new Response(JSON.stringify({ message: 'Recipe favourited!' }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(
			{ error: `Failed to add recipe to favourites: ${error.message}` },
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}
}
