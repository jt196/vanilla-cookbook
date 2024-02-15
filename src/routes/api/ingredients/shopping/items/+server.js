import { prisma } from '$lib/server/prisma'

// In your API route file, add a new function:
export async function DELETE({ locals }) {
	const session = await locals.auth.validate()
	const user = session?.user

	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		// Delete ALL purchased items
		await prisma.shoppingListItem.deleteMany({
			where: {
				userId: user.id,
				purchased: true
			}
		})

		return new Response(null, { status: 204 }) // 204 No Content
	} catch (error) {
		console.error('Failed to hide purchased items:', error)
		return new Response(JSON.stringify({ error: 'Failed to delete purchased items' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}

export async function PATCH({ locals }) {
	const session = await locals.auth.validate()
	const user = session?.user

	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		const updatedItems = await prisma.shoppingListItem.updateMany({
			where: {
				userId: user.id,
				purchased: false
			},
			data: {
				purchased: true
			}
		})

		return new Response(JSON.stringify({ updatedCount: updatedItems.count }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		console.error('Failed to bulk update shopping list items:', error)

		return new Response(JSON.stringify({ error: 'Failed to bulk update shopping list items' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
