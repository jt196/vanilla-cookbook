// src/routes/api/user/recipes/count/[id].js

import { prisma } from '$lib/server/prisma'

export async function GET({ params, locals }) {
	// Destructure the user ID from the URL params
	const { id } = params

	// Validate the logged-in user from the Lucia locals object
	const { user } = await locals.auth.validateUser()
	if (!user || user.userId !== id) {
		return new Response(JSON.stringify({ error: 'User not authenticated or wrong user.' }), {
			status: 403,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		// Count the number of recipes for this user
		const count = await prisma.Recipe.count({
			where: {
				userId: user.userId
			}
		})

		return new Response(JSON.stringify({ count }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		console.error('Error counting recipes:', error)

		return new Response(JSON.stringify({ error: 'Internal server error.' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
