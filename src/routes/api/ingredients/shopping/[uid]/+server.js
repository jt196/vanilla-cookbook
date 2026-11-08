import { prisma } from '$lib/server/prisma'
import { requireAuth, jsonError, jsonSuccess } from '$lib/server/authHelpers'

export async function DELETE({ locals, params }) {
	const user = requireAuth(locals)

	try {
		const { count } = await prisma.shoppingListItem.deleteMany({
			where: { uid: params.uid, userId: user.userId }
		})
		if (count === 0) {
			return jsonError(404, {
				error: 'Shopping list item not found',
				code: 'shopping.msg.itemNotFound'
			})
		}
		return jsonSuccess({ success: true, code: 'shopping.msg.itemDeleted' })
	} catch (error) {
		console.error('Failed to delete shopping list item:', error)
		return jsonError(500, {
			error: 'Failed to delete shopping list item',
			code: 'shopping.msg.itemDeleteFail'
		})
	}
}
