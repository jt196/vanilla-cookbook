import { prisma } from '$lib/server/prisma'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { normalizeString, normalizeNumber, pickFirst } from '$lib/utils/normalize'

export async function POST({ request, locals }) {
	const user = requireAuth(locals)

	const bodyText = await request.text()
	const ingredient = JSON.parse(bodyText)
	const name = normalizeString(pickFirst(ingredient?.ingredient, ingredient?.name))
	const { value: quantity, valid: quantityValid } = normalizeNumber(ingredient?.quantity)
	const unit = normalizeString(pickFirst(ingredient?.unitPlural, ingredient?.unit))

	if (!name) {
		return jsonError(400, {
			error: 'Invalid ingredient name',
			code: 'shopping.msg.invalidName'
		})
	}

	if (!quantityValid) {
		return jsonError(400, {
			error: 'Invalid quantity value',
			code: 'shopping.msg.invalidQuantity'
		})
	}

	try {
		const newItem = await prisma.shoppingListItem.create({
			data: {
				name,
				quantity,
				userId: user.userId,
				unit,
				...(ingredient.recipeUid && { recipeUid: ingredient.recipeUid })
			}
		})

		return jsonSuccess({ ...newItem, code: 'shopping.msg.itemAdded' })
	} catch (error) {
		console.error('Failed to add ingredient to shopping list:', error)
		return jsonError(500, {
			error: 'Failed to add ingredient to shopping list',
			code: 'shopping.msg.itemAddFail'
		})
	}
}

export async function GET({ locals }) {
	const user = requireAuth(locals)

	try {
		const shoppingList = await prisma.shoppingListItem.findMany({
			where: {
				userId: user.userId
			},
			orderBy: {
				name: 'desc'
			},
			include: {
				recipe: {
					select: {
						name: true,
						uid: true
					}
				},
				purchaseLogs: {
					select: {
						id: true
					}
				}
			}
		})

		const shoppingListWithCounts = shoppingList.map((item) => ({
			...item,
			purchaseCount: item.purchaseLogs?.length || 0
		}))

		return jsonSuccess(shoppingListWithCounts)
	} catch (error) {
		console.error(error)
		return jsonError(500, {
			error: 'Failed to fetch shopping list.',
			code: 'shopping.msg.loadFail'
		})
	}
}

export async function PATCH({ request, locals }) {
	const user = requireAuth(locals)

	const bodyText = await request.text()
	const { uid, purchased, name, quantity, unit } = JSON.parse(bodyText)
	const updateData = {}

	if (typeof purchased === 'boolean') updateData.purchased = purchased

	if (name !== undefined) {
		const normalizedName = normalizeString(name)
		if (normalizedName) updateData.name = normalizedName
	}

	if (quantity !== undefined) {
		const { value: normalizedQty, valid } = normalizeNumber(quantity)
		if (!valid) {
			return jsonError(400, {
				error: 'Invalid quantity value',
				code: 'shopping.msg.invalidQuantity'
			})
		}
		updateData.quantity = normalizedQty
	}

	if (unit !== undefined) {
		updateData.unit = normalizeString(unit)
	}

	if (Object.keys(updateData).length === 0) {
		return jsonError(400, {
			error: 'No fields to update',
			code: 'shopping.msg.noFieldsToUpdate'
		})
	}

	try {
		const currentItem = await prisma.shoppingListItem.findUnique({
			where: { uid }
		})

		if (!currentItem || currentItem.userId !== user.userId) {
			return jsonError(404, {
				error: 'Shopping list item not found',
				code: 'shopping.msg.itemNotFound'
			})
		}

		const updatedItem = await prisma.shoppingListItem.update({
			where: { uid },
			data: updateData,
			include: {
				recipe: {
					select: {
						name: true,
						uid: true
					}
				}
			}
		})

		if (purchased && !currentItem?.purchased) {
			await prisma.purchaseLog.create({
				data: {
					userId: user.userId,
					shoppingItemUid: uid,
					itemName: updatedItem.name,
					quantity: updatedItem.quantity,
					unit: updatedItem.unit
				}
			})
		}

		const purchaseCount = await prisma.purchaseLog.count({
			where: { shoppingItemUid: uid }
		})

		return jsonSuccess({ ...updatedItem, purchaseCount, code: 'shopping.msg.itemUpdated' })
	} catch (error) {
		console.error('Failed to update shopping list item:', error)
		return jsonError(500, {
			error: 'Failed to update shopping list item',
			code: 'shopping.msg.itemUpdateFail'
		})
	}
}
