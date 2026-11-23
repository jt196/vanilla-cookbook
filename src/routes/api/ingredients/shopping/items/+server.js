import { prisma } from '$lib/server/prisma'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'

/**
 * Delete all purchased items from the current user's shopping list.
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
export async function DELETE({ locals }) {
	const user = requireAuth(locals)

	try {
		await prisma.shoppingListItem.deleteMany({
			where: {
				userId: user.userId,
				purchased: true
			}
		})

		return new Response(null, { status: 204 })
	} catch (error) {
		console.error('Failed to hide purchased items:', error)
		return jsonError(500, {
			error: 'Failed to delete purchased items',
			code: 'shopping.msg.deletedPurchasedFail'
		})
	}
}

/**
 * Mark every unpurchased item on the current user's shopping list as purchased, logging a
 * purchase for each.
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
export async function PATCH({ locals }) {
	const user = requireAuth(locals)

	try {
		const updatedItems = await prisma.$transaction(async (tx) => {
			const toMark = await tx.shoppingListItem.findMany({
				where: { userId: user.userId, purchased: false },
				select: { uid: true, name: true, quantity: true, unit: true }
			})
			if (toMark.length === 0) return { count: 0 }
			const result = await tx.shoppingListItem.updateMany({
				where: { userId: user.userId, purchased: false },
				data: { purchased: true }
			})
			// Log each purchase, as ticking items one by one does, so purchase counts stay right
			await tx.purchaseLog.createMany({
				data: toMark.map((item) => ({
					userId: user.userId,
					shoppingItemUid: item.uid,
					itemName: item.name,
					quantity: item.quantity,
					unit: item.unit
				}))
			})
			return result
		})

		return jsonSuccess({
			updatedCount: updatedItems.count,
			code:
				updatedItems.count === 0
					? 'shopping.msg.noneToMark'
					: updatedItems.count === 1
						? 'shopping.msg.markedPurchased_one'
						: 'shopping.msg.markedPurchased_other',
			vars: { count: updatedItems.count }
		})
	} catch (error) {
		console.error('Failed to bulk update shopping list items:', error)
		return jsonError(500, {
			error: 'Failed to bulk update shopping list items',
			code: 'shopping.msg.updateError'
		})
	}
}
