// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/server/prisma', () => {
	const shoppingListItem = {
		findMany: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		updateMany: vi.fn()
	}
	const purchaseLog = { createMany: vi.fn() }
	const prisma = { shoppingListItem, purchaseLog, $transaction: vi.fn() }
	prisma.$transaction.mockImplementation(async (fn) => fn(prisma))
	return { prisma }
})

import { prisma } from '$lib/server/prisma'
import { POST } from '../routes/api/ingredients/shopping/+server.js'
import { PATCH as markAll } from '../routes/api/ingredients/shopping/items/+server.js'
import {
	normalizeItemName,
	planShoppingMerge,
	shoppingItemFromIngredient,
	shoppingUnitLabel,
	singularUnit
} from '$lib/utils/shopping'
import { fake } from './helpers/fake.js'

const locals = (language = 'eng') => ({ user: { userId: 'u1', language } })
const post = (body, language) =>
	POST(
		fake({
			request: new Request('http://localhost/api/ingredients/shopping', {
				method: 'POST',
				body: JSON.stringify(body)
			}),
			locals: locals(language)
		})
	)

describe('shopping helpers', () => {
	it('matches names regardless of case, spacing and simple plurals', () => {
		expect(normalizeItemName('  Onions ')).toBe('onion')
		expect(normalizeItemName('onion')).toBe('onion')
		expect(normalizeItemName('Red  Potatoes')).toBe('red potato')
		expect(normalizeItemName('cherries')).toBe('cherry')
		expect(normalizeItemName('glass')).toBe('glass')
	})

	it('stores singular units and pluralises them for display', () => {
		expect(singularUnit('teaspoons')).toBe('teaspoon')
		expect(singularUnit('Esslöffel', 'deu')).toBe('Esslöffel')
		expect(singularUnit('handful-ish')).toBe('handful-ish')
		expect(shoppingUnitLabel('teaspoons', 1)).toBe('teaspoon')
		expect(shoppingUnitLabel('teaspoon', 2)).toBe('teaspoons')
		expect(shoppingUnitLabel('bunch of', 3)).toBe('bunch of')
	})

	it('builds the item from the scaled ingredient', () => {
		const ing = { ingredient: 'flour', quantity: 200, unit: 'gram', unitPlural: 'grams' }
		expect(shoppingItemFromIngredient(ing, 1.5, 'r1')).toEqual({
			ingredient: 'flour',
			quantity: 300,
			unit: 'gram',
			recipeUid: 'r1'
		})
		const range = { ingredient: 'eggs', quantity: 2, minQty: 2, maxQty: 3, unit: null }
		expect(shoppingItemFromIngredient(range, 2).quantity).toBe(6)
		const salt = { ingredient: 'salt', quantity: null, unit: null }
		expect(shoppingItemFromIngredient(salt, 2).quantity).toBeNull()
	})

	it('adds amounts with matching units on a row still to buy', () => {
		const rows = [{ uid: 'a', name: 'flour', quantity: 200, unit: 'gram', purchased: false }]
		expect(planShoppingMerge(rows, { quantity: 100, unit: 'grams' })).toEqual({
			action: 'update',
			uid: 'a',
			quantity: 300,
			unit: 'gram'
		})
	})

	it('keeps a separate row when units cannot be combined', () => {
		const rows = [{ uid: 'a', name: 'flour', quantity: 200, unit: 'gram', purchased: false }]
		expect(planShoppingMerge(rows, { quantity: 1, unit: 'cup' }).action).toBe('create')
	})

	it('puts a history row back on the list with the new amount', () => {
		const rows = [{ uid: 'h', name: 'milk', quantity: 2, unit: 'pint', purchased: true }]
		expect(planShoppingMerge(rows, { quantity: 1, unit: 'liter' })).toEqual({
			action: 'update',
			uid: 'h',
			quantity: 1,
			unit: 'liter'
		})
	})

	it('creates a row when nothing matches', () => {
		expect(planShoppingMerge([], { quantity: null, unit: null }).action).toBe('create')
	})
})

describe('POST /api/ingredients/shopping', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.mocked(prisma.$transaction).mockImplementation(fake(async (fn) => fn(prisma)))
		vi.mocked(prisma.shoppingListItem.create).mockImplementation(
			fake(async ({ data }) => ({ uid: 'new', purchased: false, purchaseLogs: [], ...data }))
		)
		vi.mocked(prisma.shoppingListItem.update).mockImplementation(
			fake(async ({ where, data }) => ({
				uid: where.uid,
				name: 'milk',
				purchaseLogs: [{}],
				...data
			}))
		)
	})

	it('stores the singular unit', async () => {
		vi.mocked(prisma.shoppingListItem.findMany).mockResolvedValue([])
		await post({ ingredient: 'salt', quantity: 1, unit: 'teaspoon', unitPlural: 'teaspoons' })
		expect(prisma.shoppingListItem.create).toHaveBeenCalledWith(
			expect.objectContaining({ data: expect.objectContaining({ unit: 'teaspoon' }) })
		)
	})

	it('reuses a purchased row instead of creating a duplicate', async () => {
		vi.mocked(prisma.shoppingListItem.findMany).mockResolvedValue(
			fake([{ uid: 'h', name: 'Milk', quantity: 1, unit: 'pint', purchased: true }])
		)
		const res = await post({ name: 'milk' })
		const body = await res.json()
		expect(prisma.shoppingListItem.create).not.toHaveBeenCalled()
		expect(prisma.shoppingListItem.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { uid: 'h' },
				data: expect.objectContaining({ purchased: false })
			})
		)
		expect(body).toMatchObject({ uid: 'h', merged: true, purchaseCount: 1 })
	})

	it('merges a list of items, including repeats within the list', async () => {
		vi.mocked(prisma.shoppingListItem.findMany).mockResolvedValue([])
		vi.mocked(prisma.shoppingListItem.update).mockImplementation(
			fake(async ({ where, data }) => ({
				uid: where.uid,
				name: 'onion',
				purchased: false,
				purchaseLogs: [],
				...data
			}))
		)
		const res = await post({
			items: [
				{ ingredient: 'onions', quantity: 2, unit: null, recipeUid: 'r1' },
				{ ingredient: 'onion', quantity: 1, unit: null, recipeUid: 'r1' }
			]
		})
		const body = await res.json()
		expect(prisma.shoppingListItem.create).toHaveBeenCalledTimes(1)
		expect(prisma.shoppingListItem.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { uid: 'new' },
				data: expect.objectContaining({ quantity: 3 })
			})
		)
		expect(body.items).toHaveLength(2)
		expect(body.code).toBe('shopping.msg.itemsAdded_other')
	})

	it('rejects an item without a name', async () => {
		const res = await post({ items: [{ ingredient: '' }] })
		expect(res.status).toBe(400)
	})
})

describe('PATCH /api/ingredients/shopping/items (mark all purchased)', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(prisma.$transaction).mockImplementation(fake(async (fn) => fn(prisma)))
	})

	it('logs a purchase for every item it marks', async () => {
		vi.mocked(prisma.shoppingListItem.findMany).mockResolvedValue(
			fake([
				{ uid: 'a', name: 'milk', quantity: 1, unit: 'pint' },
				{ uid: 'b', name: 'eggs', quantity: 6, unit: null }
			])
		)
		vi.mocked(prisma.shoppingListItem.updateMany).mockResolvedValue({ count: 2 })
		const res = await markAll(fake({ locals: locals() }))
		const body = await res.json()
		expect(body.updatedCount).toBe(2)
		expect(prisma.purchaseLog.createMany).toHaveBeenCalledWith({
			data: [
				expect.objectContaining({ shoppingItemUid: 'a', itemName: 'milk' }),
				expect.objectContaining({ shoppingItemUid: 'b', itemName: 'eggs' })
			]
		})
	})
})
