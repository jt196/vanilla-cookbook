import { prisma } from '$lib/server/prisma'
import { requireAuth, jsonError } from '$lib/server/authHelpers'

export async function DELETE({ locals, params }) {
	requireAuth(locals)
	const { uid } = params

	try {
		await prisma.shoppingListItem.delete({
			where: { uid }
		})

		return new Response(null, { status: 204 })
	} catch (error) {
		console.error('Failed to delete shopping list item:', error)
		return jsonError(500, 'Failed to delete shopping list item')
	}
}
