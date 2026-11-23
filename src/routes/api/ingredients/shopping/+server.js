import { prisma } from '$lib/server/prisma'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { normalizeString, normalizeNumber, pickFirst } from '$lib/utils/normalize'
import {
	normalizeItemName,
	planShoppingMerge,
	roundShoppingQuantity,
	singularUnit
} from '$lib/utils/shopping'

const itemInclude = {
	recipe: { select: { name: true, uid: true } },
	purchaseLogs: { select: { id: true } }
}

/**
 * A stored row with its purchase count in place of the raw purchase logs.
 *
 * @param {any} row
 * @returns {any}
 */
function withPurchaseCount(row) {
	const { purchaseLogs, ...rest } = row
	return { ...rest, purchaseCount: purchaseLogs?.length ?? 0 }
}

/**
 * Read one incoming item: name, quantity and singular unit. The parser's `ingredient`
 * field wins over `name`, and the singular `unit` over `unitPlural`.
 *
 * @param {any} ingredient
 * @param {string} lang
 * @returns {{ name: string|null, quantity: number|null, quantityValid: boolean, unit: string|null, recipeUid: string|null }}
 */
function readItem(ingredient, lang) {
	const name = normalizeString(pickFirst(ingredient?.ingredient, ingredient?.name))
	const { value, valid } = normalizeNumber(ingredient?.quantity)
	const unit = singularUnit(
		normalizeString(pickFirst(ingredient?.unit, ingredient?.unitPlural)),
		lang
	)
	const recipeUid = normalizeString(ingredient?.recipeUid)
	return { name, quantity: roundShoppingQuantity(value), quantityValid: valid, unit, recipeUid }
}

/**
 * Add one or more items to the current user's shopping list. Body: one item (name or
 * ingredient, quantity, unit, optional recipeUid), or `{ items: [...] }` for several.
 *
 * An item whose name matches a row already on the list is merged into it instead of
 * creating a duplicate (see `planShoppingMerge`). The response is the added or updated
 * row (or `{ items }` for several), each with `merged: true` when an existing row was used.
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
export async function POST({ request, locals }) {
	const user = requireAuth(locals)
	const lang = user.language || 'eng'

	let body
	try {
		body = JSON.parse(await request.text())
	} catch {
		return jsonError(400, { error: 'Invalid request body', code: 'shopping.msg.itemAddFail' })
	}
	const isBulk = Array.isArray(body?.items)
	const items = (isBulk ? body.items : [body]).map((item) => readItem(item, lang))

	if (items.length === 0 || items.some((item) => !item.name)) {
		return jsonError(400, {
			error: 'Invalid ingredient name',
			code: 'shopping.msg.invalidName'
		})
	}

	if (items.some((item) => !item.quantityValid)) {
		return jsonError(400, {
			error: 'Invalid quantity value',
			code: 'shopping.msg.invalidQuantity'
		})
	}

	try {
		const results = await prisma.$transaction(async (tx) => {
			const existing = await tx.shoppingListItem.findMany({
				where: { userId: user.userId },
				select: { uid: true, name: true, quantity: true, unit: true, purchased: true }
			})
			const saved = []
			for (const item of items) {
				const nameKey = normalizeItemName(item.name)
				const matches = existing.filter((row) => normalizeItemName(row.name) === nameKey)
				const plan = planShoppingMerge(matches, item, lang)
				let row
				if (plan.action === 'update' && plan.uid) {
					row = await tx.shoppingListItem.update({
						where: { uid: plan.uid },
						data: {
							quantity: plan.quantity,
							unit: plan.unit,
							purchased: false,
							...(item.recipeUid && { recipeUid: item.recipeUid })
						},
						include: itemInclude
					})
					saved.push({ ...withPurchaseCount(row), merged: true })
				} else {
					row = await tx.shoppingListItem.create({
						data: {
							name: item.name,
							quantity: plan.quantity,
							unit: plan.unit,
							userId: user.userId,
							...(item.recipeUid && { recipeUid: item.recipeUid })
						},
						include: itemInclude
					})
					saved.push({ ...withPurchaseCount(row), merged: false })
				}
				// Later items in the same request merge into this row too
				const index = existing.findIndex((r) => r.uid === row.uid)
				const summary = {
					uid: row.uid,
					name: row.name,
					quantity: row.quantity,
					unit: row.unit,
					purchased: row.purchased
				}
				if (index >= 0) existing[index] = summary
				else existing.push(summary)
			}
			return saved
		})

		if (isBulk) {
			return jsonSuccess({
				items: results,
				code:
					results.length === 1 ? 'shopping.msg.itemsAdded_one' : 'shopping.msg.itemsAdded_other',
				vars: { count: results.length }
			})
		}
		return jsonSuccess({ ...results[0], code: 'shopping.msg.itemAdded' })
	} catch (error) {
		console.error('Failed to add ingredient to shopping list:', error)
		return jsonError(500, {
			error: 'Failed to add ingredient to shopping list',
			code: 'shopping.msg.itemAddFail'
		})
	}
}

/**
 * The current user's shopping list, with each item's recipe and purchase count.
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
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

/**
 * Update one of the current user's shopping list items (purchased, name, quantity, unit);
 * logs a purchase when it's ticked.
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
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
