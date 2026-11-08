import { prisma } from '$lib/server/prisma'

/**
 * Nested-relation select for picking a recipe's display photo with `mainPhoto()`.
 *
 * Deliberately has no `orderBy`/`take`: Prisma loads nested relations with
 * `WHERE recipeUid IN (...)`, and only splits that list into SQLite-sized chunks when the
 * nested read is unordered. With an `orderBy`, a list of more than ~1000 recipes fails
 * with P2029 ("query parameter limit exceeded").
 */
export const PHOTO_SELECT = { select: { id: true, isMain: true } }

/**
 * The photo to display for a recipe: the main photo, else the lowest id.
 *
 * @param {Array<{ id: string, isMain?: boolean | null }>} [photos]
 * @returns {Array<{ id: string }>} Zero or one photo, in the shape feed cards expect
 */
export function mainPhoto(photos = []) {
	let best = null
	for (const photo of photos) {
		if (
			!best ||
			(photo.isMain && !best.isMain) ||
			(!!photo.isMain === !!best.isMain && photo.id < best.id)
		) {
			best = photo
		}
	}
	return best ? [{ id: best.id }] : []
}

/**
 * Fields needed for a feed card plus client-side search/sort. Full directions, times and
 * categories are loaded by the recipe detail page instead. `ingredients` stays until search
 * moves server-side, so client-side ingredient search keeps working.
 */
const FEED_SELECT = {
	uid: true,
	name: true,
	image_url: true,
	ingredients: true,
	source: true,
	rating: true,
	created: true,
	on_favorites: true,
	parentRecipeId: true,
	userId: true,
	auth_user: { select: { username: true } },
	log: { select: { cooked: true } },
	photos: PHOTO_SELECT
}

/**
 * Visibility filter for recipes a viewer may see across all users.
 *
 * @param {{ userId: string, isAdmin?: boolean } | null} viewer
 * @returns {object} Prisma `where` clause
 */
export function visibleRecipesWhere(viewer) {
	if (viewer?.isAdmin) return { in_trash: false }
	if (viewer) return { in_trash: false, OR: [{ userId: viewer.userId }, { is_public: true }] }
	return { in_trash: false, is_public: true }
}

/**
 * Visibility filter for one user's recipe list.
 * Owners also see public recipes they've favourited; admins see everything the user owns;
 * everyone else sees only the user's public recipes. Trashed recipes are always excluded.
 *
 * @param {string} ownerId
 * @param {{ userId: string, isAdmin?: boolean } | null} viewer
 * @returns {object} Prisma `where` clause
 */
export function userRecipesWhere(ownerId, viewer) {
	if (viewer?.userId === ownerId) {
		return {
			in_trash: false,
			OR: [{ userId: ownerId }, { is_public: true, favorites: { some: { userId: ownerId } } }]
		}
	}
	if (viewer?.isAdmin) return { in_trash: false, userId: ownerId }
	return { in_trash: false, userId: ownerId, is_public: true }
}

/**
 * Load feed cards for `where`, annotated with the viewer's favourite and copy status.
 *
 * The viewer's favourites and copies are fetched in full rather than filtered by the loaded
 * recipe UIDs: that list can run to thousands of entries and overflow SQLite's
 * bound-parameter limit. Both sets are bounded by the viewer's own activity.
 *
 * @param {object} where - Prisma `where` clause
 * @param {{ userId: string } | null} viewer
 * @returns {Promise<Array<object>>}
 */
export async function loadRecipeFeed(where, viewer) {
	const recipes = await prisma.recipe.findMany({
		where,
		orderBy: { created: 'desc' },
		select: FEED_SELECT
	})

	let favourites = new Set()
	let copies = new Set()
	if (viewer && recipes.length > 0) {
		const [favs, forks] = await Promise.all([
			prisma.recipeFavorite.findMany({
				where: { userId: viewer.userId },
				select: { recipeUid: true }
			}),
			prisma.recipe.findMany({
				where: { userId: viewer.userId, parentRecipeId: { not: null } },
				select: { parentRecipeId: true }
			})
		])
		favourites = new Set(favs.map((f) => f.recipeUid))
		copies = new Set(forks.map((f) => f.parentRecipeId))
	}

	return recipes.map((recipe) => ({
		...recipe,
		photos: mainPhoto(recipe.photos),
		on_favorites: favourites.has(recipe.uid),
		duplicatedByViewer: copies.has(recipe.uid)
	}))
}
