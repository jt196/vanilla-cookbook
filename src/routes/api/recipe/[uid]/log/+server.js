import { prisma } from '$lib/server/prisma'

// Handle recipe log creation
export async function POST({ locals, params }) {
	const session = await locals.auth.validate()
	const user = session?.user

	const { uid } = params
	let recipeLog
	if (!session || !user) {
		return new Response('User not authenticated!', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
	try {
		recipeLog = await prisma.RecipeLog.create({
			data: {
				recipeUid: uid,
				userId: user.userId,
				cooked: new Date()
			}
		})
	} catch (err) {
		console.log('Error: ' + err)
		return new Response(
			{ err: `Failed to add recipe log: ${err.message}` },
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}
	return new Response(
		JSON.stringify({
			recipeLog
		}),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		}
	)
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
			}
		})
		if (!recipe.is_public && (!session || !user)) {
			return new Response('User not authenticated!', {
				status: 401,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}
		if (recipe.userId !== user.userId) {
			return new Response(
				JSON.stringify({ error: 'Recipe does not belong to authenticated user.' }),
				{
					status: 401,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
		}
	} catch (error) {
		return new Response(JSON.stringify({ error: `Failed to find recipe: ${error.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		const recipeLogs = await prisma.RecipeLog.findMany({
			where: {
				recipeUid: uid
			},
			orderBy: {
				cooked: 'desc'
			}
		})
		return new Response(JSON.stringify(recipeLogs), {
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
