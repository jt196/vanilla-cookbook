import { prisma } from '$lib/server/prisma'

export async function GET({ params, locals }) {
	// Validate the requesting user's session and get their userId
	const session = await locals.auth.validate()
	const user = session?.user

	if (!session || !user) {
		console.log('User Not Authenticated!')
		return new Response('User not authenticated', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	if (params.id !== user.userId) {
		return new Response('Unauthorized to view recipe logs.', {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		const recipeLogs = await prisma.recipeLog.findMany({
			where: {
				userId: params.id // Replace `userId` with the actual user ID
			},
			select: {
				id: true,
				cooked: true,
				recipeUid: true,
				recipe: {
					select: {
						name: true
						// And any more fields you want here
					}
				}
			}
		})

		return new Response(JSON.stringify(recipeLogs), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		console.error(error)
		return new Response(JSON.stringify({ error: 'Failed to fetch recipe logs.' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
