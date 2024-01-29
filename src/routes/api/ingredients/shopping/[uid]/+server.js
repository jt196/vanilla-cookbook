import { prisma } from '$lib/server/prisma'

// In your API route file, add a new function:
export async function DELETE({ locals, params }) {
	const session = await locals.auth.validate()
	const user = session.user
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
		// Delete the shopping list item
		await prisma.shoppingListItem.delete({
			where: {
				uid: uid
			}
		})

		return new Response(null, { status: 204 }) // 204 No Content
	} catch (error) {
		console.error('Failed to delete shopping list item:', error)
		return new Response(JSON.stringify({ error: 'Failed to delete shopping list item' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
