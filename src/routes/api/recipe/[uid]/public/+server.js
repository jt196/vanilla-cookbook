import { prisma } from '$lib/server/prisma'

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
			console.log('Unauthorised to public!')
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
				is_public: !recipe.is_public
			}
		})

		return new Response(JSON.stringify({ message: 'Recipe made public!' }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(
			{ error: `Failed to make recipe public: ${error.message}` },
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}
}
