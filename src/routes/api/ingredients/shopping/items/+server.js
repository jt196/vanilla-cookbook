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
 * Mark every unpurchased item on the current user's shopping list as purchased.
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
export async function PATCH({ locals }) {
	const user = requireAuth(locals)

	try {
		const updatedItems = await prisma.shoppingListItem.updateMany({
			where: {
				userId: user.userId,
				purchased: false
			},
			data: {
				purchased: true
			}
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
