import { prisma } from '$lib/server/prisma'
import { requireAuth, jsonError, jsonSuccess } from '$lib/server/authHelpers'

export async function DELETE({ locals, params }) {
	requireAuth(locals)
	const { uid } = params

	try {
		await prisma.shoppingListItem.delete({
			where: { uid }
		})

		return jsonSuccess({ success: true, code: 'shopping.msg.itemDeleted' })
	} catch (error) {
		console.error('Failed to delete shopping list item:', error)
		return jsonError(500, {
			error: 'Failed to delete shopping list item',
			code: 'shopping.msg.itemDeleteFail'
		})
	}
}
