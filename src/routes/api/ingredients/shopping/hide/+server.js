import { prisma } from '$lib/server/prisma'

// In your API route file, add a new function:
export async function PATCH({ locals }) {
	const session = await locals.auth.validate()
	const user = session.user

	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		// Update all purchased items to be hidden for the current user
		await prisma.shoppingListItem.updateMany({
			where: {
				userId: user.id,
				purchased: true,
				hidden: false
			},
			data: {
				hidden: true
			}
		})

		return new Response(null, { status: 204 }) // 204 No Content
	} catch (error) {
		console.error('Failed to hide purchased items:', error)
		return new Response(JSON.stringify({ error: 'Failed to hide purchased items' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
