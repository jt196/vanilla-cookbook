/**
 * Recently viewed recipes, kept in localStorage per user (and separately for visitors), for
 * the command palette. Storage can be unavailable (private mode) or hold junk, so every read
 * and write is guarded and falls back to an empty list.
 *
 * @module recentRecipes
 */

export const MAX_RECENT = 5

/**
 * @typedef {{ uid: string, name: string, photoId: string | null, image_url: string | null }} RecentRecipe
 */

const storageKey = (userId) => `vanilla:recent:${userId || 'visitor'}`

/**
 * Put a recipe at the front of the list, removing any earlier entry for it.
 *
 * @param {RecentRecipe[]} list
 * @param {RecentRecipe} entry
 * @param {number} [max]
 * @returns {RecentRecipe[]}
 */
export function addRecent(list, entry, max = MAX_RECENT) {
	return [entry, ...list.filter((item) => item.uid !== entry.uid)].slice(0, max)
}

/**
 * The compact entry stored for a recipe: its main (or first) photo, else its image URL.
 *
 * @param {{ uid: string, name?: string, image_url?: string | null, photos?: Array<{ id: string, isMain?: boolean }> }} recipe
 * @returns {RecentRecipe}
 */
export function toRecent(recipe) {
	const photo = recipe.photos?.find((p) => p.isMain) ?? recipe.photos?.[0]
	return {
		uid: recipe.uid,
		name: recipe.name || '',
		photoId: photo?.id ?? null,
		image_url: photo ? null : (recipe.image_url ?? null)
	}
}

/**
 * Recently viewed recipes for a user, most recent first.
 *
 * @param {string | null | undefined} userId
 * @param {Storage} [storage]
 * @returns {RecentRecipe[]}
 */
export function getRecentRecipes(userId, storage = globalThis.localStorage) {
	try {
		const list = JSON.parse(storage.getItem(storageKey(userId)) || '[]')
		return Array.isArray(list) ? list.filter((item) => item?.uid && item?.name) : []
	} catch {
		return []
	}
}

/**
 * Record that a user viewed a recipe.
 *
 * @param {string | null | undefined} userId
 * @param {Parameters<typeof toRecent>[0]} recipe
 * @param {Storage} [storage]
 */
export function rememberRecipe(userId, recipe, storage = globalThis.localStorage) {
	if (!recipe?.uid) return
	try {
		const list = addRecent(getRecentRecipes(userId, storage), toRecent(recipe))
		storage.setItem(storageKey(userId), JSON.stringify(list))
	} catch {
		// Storage full or blocked: recents are a convenience, so ignore
	}
}
