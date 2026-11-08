import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as crud from '$lib/utils/crud'

/** Build a fetch Response-like object. */
function res(status, body) {
	return new Response(body === undefined ? null : JSON.stringify(body), {
		status,
		headers: body === undefined ? {} : { 'Content-Type': 'application/json' }
	})
}

describe('crud.js client helpers', () => {
	let fetchMock

	beforeEach(() => {
		fetchMock = vi.fn()
		vi.stubGlobal('fetch', fetchMock)
		vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.spyOn(console, 'log').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	describe('boolean helpers', () => {
		const cases = [
			['deleteRecipeById', ['r1'], '/api/recipe/r1', 'DELETE'],
			['changeRecipeFavourite', ['r1'], '/api/recipe/r1/favourite', 'PUT'],
			['changeRecipePublic', ['r1'], '/api/recipe/r1/public', 'PUT'],
			['deletePhotoById', ['p1'], '/api/recipe/image/p1', 'DELETE'],
			['updatePhotos', [[{ id: 'p1' }]], '/api/recipe/images', 'PUT']
		]

		it.each(cases)('%s returns true on success', async (fn, args, url, method) => {
			fetchMock.mockResolvedValue(res(200, { ok: 1 }))
			expect(await crud[fn](...args)).toBe(true)
			expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({ method }))
		})

		it.each(cases)('%s returns false on HTTP error', async (fn, args) => {
			fetchMock.mockResolvedValue(res(403, { error: 'nope' }))
			expect(await crud[fn](...args)).toBe(false)
		})

		it.each(cases)('%s returns false on network error', async (fn, args) => {
			fetchMock.mockRejectedValue(new Error('offline'))
			expect(await crud[fn](...args)).toBe(false)
		})

		it('updatePhotos sends the photos as JSON', async () => {
			fetchMock.mockResolvedValue(res(200, {}))
			await crud.updatePhotos([{ id: 'p1', isMain: true }])
			expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual([{ id: 'p1', isMain: true }])
		})
	})

	describe('duplicateRecipe', () => {
		it('returns uid and code on success', async () => {
			fetchMock.mockResolvedValue(res(200, { uid: 'new1', code: 'recipe.msg.duplicated' }))
			expect(await crud.duplicateRecipe('r1')).toEqual({
				success: true,
				uid: 'new1',
				code: 'recipe.msg.duplicated'
			})
		})

		it('returns the server error and code on failure', async () => {
			fetchMock.mockResolvedValue(res(409, { error: 'exists', code: 'recipe.msg.duplicateExists' }))
			expect(await crud.duplicateRecipe('r1')).toEqual({
				success: false,
				uid: null,
				error: 'exists',
				code: 'recipe.msg.duplicateExists'
			})
		})
	})

	describe('recipeRatingChange', () => {
		it('PUTs the rating and does not throw on failure', async () => {
			fetchMock.mockResolvedValue(res(500, { error: 'x' }))
			await expect(crud.recipeRatingChange(4, 'r1')).resolves.toBeUndefined()
			expect(fetchMock).toHaveBeenCalledWith(
				'/api/recipe/r1/rating',
				expect.objectContaining({ method: 'PUT', body: JSON.stringify({ rating: 4 }) })
			)
		})
	})

	describe('createRecipe / updateRecipe', () => {
		it.each([
			['createRecipe', [new FormData()], '/api/recipe', 'POST'],
			['updateRecipe', [new FormData(), 'r1'], '/api/recipe/r1', 'PUT']
		])('%s wraps success data', async (fn, args, url, method) => {
			fetchMock.mockResolvedValue(res(200, { uid: 'r1' }))
			expect(await crud[fn](...args)).toEqual({ success: true, data: { uid: 'r1' } })
			expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({ method }))
		})

		it.each([
			['createRecipe', [new FormData()]],
			['updateRecipe', [new FormData(), 'r1']]
		])('%s returns error + code on failure', async (fn, args) => {
			fetchMock.mockResolvedValue(res(500, { error: 'boom', code: 'x.y' }))
			expect(await crud[fn](...args)).toEqual({ success: false, error: 'boom', code: 'x.y' })
		})

		it.each([
			['createRecipe', [new FormData()]],
			['updateRecipe', [new FormData(), 'r1']]
		])('%s tolerates a non-JSON error body', async (fn, args) => {
			fetchMock.mockResolvedValue(new Response('Bad gateway', { status: 502 }))
			const result = await crud[fn](...args)
			expect(result.success).toBe(false)
			expect(typeof result.error).toBe('string')
		})

		it.each([
			['createRecipe', [new FormData()], 'recipe.msg.createTimeout'],
			['updateRecipe', [new FormData(), 'r1'], 'recipe.msg.saveTimeout']
		])('%s reports a timeout code when aborted', async (fn, args, code) => {
			fetchMock.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }))
			const result = await crud[fn](...args)
			expect(result).toMatchObject({ success: false, code })
		})
	})

	describe('result-object helpers', () => {
		it.each([
			['addIngredientToShoppingList', [{ name: 'egg' }], '/api/ingredients/shopping'],
			['addRecipeLog', ['r1', 'tasty', 2], '/api/recipe/r1/log']
		])('%s wraps success and failure', async (fn, args, url) => {
			fetchMock.mockResolvedValueOnce(res(200, { id: 1 }))
			expect(await crud[fn](...args)).toEqual({ success: true, data: { id: 1 } })
			expect(fetchMock.mock.calls[0][0]).toBe(url)

			fetchMock.mockResolvedValueOnce(res(400, { error: 'bad', code: 'c' }))
			expect(await crud[fn](...args)).toEqual({ success: false, error: 'bad', code: 'c' })
		})

		it('addRecipeLog sends note and scale', async () => {
			fetchMock.mockResolvedValue(res(200, {}))
			await crud.addRecipeLog('r1', 'tasty', 2)
			expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ note: 'tasty', scale: 2 })
		})
	})

	describe('throwing shopping helpers', () => {
		it('updateShoppingListItem returns JSON and throws with code on error', async () => {
			fetchMock.mockResolvedValueOnce(res(200, { uid: 's1', purchased: true }))
			expect(await crud.updateShoppingListItem({ uid: 's1' })).toEqual({
				uid: 's1',
				purchased: true
			})

			fetchMock.mockResolvedValueOnce(
				res(404, { error: 'gone', code: 'shopping.msg.itemNotFound' })
			)
			await expect(crud.updateShoppingListItem({ uid: 's1' })).rejects.toMatchObject({
				message: 'gone',
				code: 'shopping.msg.itemNotFound'
			})
		})

		it.each([
			['deletePurchasedItems', [], '/api/ingredients/shopping/items', 'DELETE'],
			['markPurchasedItems', [], '/api/ingredients/shopping/items', 'PATCH'],
			['deleteShoppingListItem', ['s1'], '/api/ingredients/shopping/s1', 'DELETE']
		])('%s handles 204, JSON and errors', async (fn, args, url, method) => {
			fetchMock.mockResolvedValueOnce(res(204))
			expect(await crud[fn](...args)).toEqual({ success: true })
			expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({ method }))

			fetchMock.mockResolvedValueOnce(res(200, { updatedCount: 2 }))
			expect(await crud[fn](...args)).toEqual({ updatedCount: 2 })

			fetchMock.mockResolvedValueOnce(res(500, { error: 'fail', code: 'e' }))
			await expect(crud[fn](...args)).rejects.toMatchObject({ message: 'fail', code: 'e' })
		})
	})
})
