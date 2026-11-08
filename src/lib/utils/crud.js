// Client-side wrappers around the recipe, photo, shopping and log API routes.

const JSON_HEADERS = { 'Content-Type': 'application/json' }
const SAVE_TIMEOUT_MS = 30000

/**
 * Fetch an API route and parse the response.
 *
 * @param {string} url
 * @param {RequestInit} init
 * @param {string} fallback - Error message used when the server gives none.
 * @returns {Promise<any>} Parsed JSON, `{ success: true }` for 204, or null for an empty body.
 * @throws {Error & { code?: string | null }} On a non-2xx response; carries the server's `code`.
 */
async function request(url, init, fallback) {
	const response = await fetch(url, init)
	if (response.status === 204) return { success: true }

	const text = await response.text()
	let payload = null
	try {
		payload = text ? JSON.parse(text) : null
	} catch {
		// Non-JSON body
	}

	if (!response.ok) {
		throw Object.assign(new Error(payload?.error || payload?.message || fallback), {
			code: payload?.code || null
		})
	}
	return payload
}

const jsonInit = (method, body) => ({
	method,
	headers: JSON_HEADERS,
	...(body !== undefined && { body: JSON.stringify(body) })
})

/** Run a request, returning true on success and false (after logging) on any failure. */
async function succeeded(url, init, fallback) {
	try {
		await request(url, init, fallback)
		return true
	} catch (error) {
		console.error(`${fallback}:`, error.message)
		return false
	}
}

/** Run a request, returning `{ success, data }` or `{ success: false, error, code }`. */
async function asResult(url, init, fallback) {
	try {
		return { success: true, data: await request(url, init, fallback) }
	} catch (error) {
		console.error(`${fallback}:`, error.message)
		return { success: false, error: error.message, code: error.code || null }
	}
}

/** Run a request, logging and rethrowing on failure. */
async function orThrow(url, init, fallback) {
	try {
		return await request(url, init, fallback)
	} catch (error) {
		console.error(`${fallback}:`, error.message)
		throw error
	}
}

/**
 * Save a recipe (create or update) with a timeout, since the server may download a remote image.
 *
 * @param {string} url
 * @param {'POST' | 'PUT'} method
 * @param {FormData} formData
 * @param {{ error: string, code: string }} timeoutResult - Returned when the request times out.
 * @param {string} fallback
 */
async function saveRecipe(url, method, formData, timeoutResult, fallback) {
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), SAVE_TIMEOUT_MS)
	try {
		const data = await request(url, { method, body: formData, signal: controller.signal }, fallback)
		return { success: true, data }
	} catch (error) {
		if (error?.name === 'AbortError') {
			console.error(`${fallback}: request timed out after ${SAVE_TIMEOUT_MS}ms`)
			return { success: false, ...timeoutResult }
		}
		console.error(`${fallback}:`, error.message)
		return { success: false, error: error.message, code: error.code || null }
	} finally {
		clearTimeout(timeoutId)
	}
}

/**
 * Deletes a recipe.
 * @param {string} uid
 * @returns {Promise<boolean>}
 */
export const deleteRecipeById = (uid) =>
	succeeded(`/api/recipe/${uid}`, jsonInit('DELETE'), 'Error deleting recipe')

/**
 * Toggles whether the current user has favourited a recipe.
 * @param {string} uid
 * @returns {Promise<boolean>}
 */
export const changeRecipeFavourite = (uid) =>
	succeeded(`/api/recipe/${uid}/favourite`, jsonInit('PUT'), 'Error favouriting recipe')

/**
 * Toggles a recipe's public status.
 * @param {string} uid
 * @returns {Promise<boolean>}
 */
export const changeRecipePublic = (uid) =>
	succeeded(`/api/recipe/${uid}/public`, jsonInit('PUT'), 'Error changing recipe public status')

/**
 * Deletes a single photo.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export const deletePhotoById = (id) =>
	succeeded(`/api/recipe/image/${id}`, jsonInit('DELETE'), 'Error deleting photo')

/**
 * Updates the `isMain` / `notes` fields of one or more photos.
 * @param {Array<{ id: string, isMain?: boolean, notes?: string }>} photos
 * @returns {Promise<boolean>}
 */
export const updatePhotos = (photos) =>
	succeeded('/api/recipe/images', jsonInit('PUT', photos), 'Error updating photos')

/**
 * Duplicates another user's recipe into the current user's account.
 * @param {string} uid
 * @returns {Promise<{ success: boolean, uid: string | null, error?: string, code?: string | null }>}
 */
export async function duplicateRecipe(uid) {
	const result = await asResult(
		`/api/recipe/${uid}/duplicate`,
		jsonInit('POST'),
		'Error duplicating recipe'
	)
	if (!result.success) return { ...result, uid: null }
	return { success: true, uid: result.data?.uid || null, code: result.data?.code || null }
}

/**
 * Updates a recipe's rating. Failures are logged, not thrown.
 * @param {number} newRating
 * @param {string} uid
 */
export async function recipeRatingChange(newRating, uid) {
	await succeeded(
		`/api/recipe/${uid}/rating`,
		jsonInit('PUT', { rating: newRating }),
		'Failed to update rating'
	)
}

/**
 * Updates an existing recipe.
 * @param {FormData} formData - Recipe JSON under `recipe`, optional files under `images`.
 * @param {string} recipeId
 * @returns {Promise<{ success: boolean, data?: any, error?: string, code?: string | null }>}
 */
export const updateRecipe = (formData, recipeId) =>
	saveRecipe(
		`/api/recipe/${recipeId}`,
		'PUT',
		formData,
		{ error: 'Saving the recipe timed out.', code: 'recipe.msg.saveTimeout' },
		'Error updating recipe'
	)

/**
 * Creates a new recipe.
 * @param {FormData} formData - Recipe JSON under `recipe`, optional files under `images`.
 * @returns {Promise<{ success: boolean, data?: any, error?: string, code?: string | null }>}
 */
export const createRecipe = (formData) =>
	saveRecipe(
		'/api/recipe',
		'POST',
		formData,
		{
			error:
				'Saving the recipe timed out. The server may still be processing a remote image. Try saving again with image download disabled.',
			code: 'recipe.msg.createTimeout'
		},
		'Error creating recipe'
	)

/**
 * Adds an ingredient to the shopping list.
 * @param {object} ingredient
 * @returns {Promise<{ success: boolean, data?: any, error?: string, code?: string | null }>}
 */
export const addIngredientToShoppingList = (ingredient) =>
	asResult(
		'/api/ingredients/shopping',
		jsonInit('POST', ingredient),
		'Error creating shopping list item'
	)

/**
 * Updates a shopping list item.
 * @param {object} item - Must include `uid`.
 * @returns {Promise<object>} The updated item.
 * @throws {Error} On failure.
 */
export const updateShoppingListItem = (item) =>
	orThrow('/api/ingredients/shopping', jsonInit('PATCH', item), 'Error updating shopping list item')

/**
 * Deletes all purchased items from the shopping list.
 * @returns {Promise<object | null>}
 * @throws {Error} On failure.
 */
export const deletePurchasedItems = () =>
	orThrow('/api/ingredients/shopping/items', jsonInit('DELETE'), 'Error deleting purchased items')

/**
 * Marks every unpurchased shopping list item as purchased.
 * @returns {Promise<object | null>}
 * @throws {Error} On failure.
 */
export const markPurchasedItems = () =>
	orThrow('/api/ingredients/shopping/items', jsonInit('PATCH'), 'Error marking items purchased')

/**
 * Deletes a single shopping list item.
 * @param {string} uid
 * @returns {Promise<object | null>}
 * @throws {Error} On failure.
 */
export const deleteShoppingListItem = (uid) =>
	orThrow(
		`/api/ingredients/shopping/${uid}`,
		jsonInit('DELETE'),
		'Error deleting shopping list item'
	)

/**
 * Logs that a recipe was cooked.
 * @param {string} recipeUid
 * @param {string | null} [note]
 * @param {number} [scale]
 * @returns {Promise<{ success: boolean, data?: any, error?: string, code?: string | null }>}
 */
export const addRecipeLog = (recipeUid, note = null, scale = 1) =>
	asResult(
		`/api/recipe/${recipeUid}/log`,
		jsonInit('POST', { note, scale }),
		'Error creating recipe log'
	)
