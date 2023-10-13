import { prisma } from '$lib/server/prisma'

export async function GET({ locals }) {
	const { session, user } = await locals.auth.validateUser()

	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	// Ensure the user is an admin
	if (!user.isAdmin) {
		return new Response(
			JSON.stringify({ error: 'Unauthorized! You must be an admin to view all users.' }),
			{
				status: 403,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}

	try {
		const users = await prisma.authUser.findMany()
		return new Response(JSON.stringify(users), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: `Failed to fetch users: ${error.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
