import { prisma } from '$lib/server/prisma'
import { getOptionalUser, jsonSuccess } from '$lib/server/authHelpers'
import { mainPhoto, PHOTO_SELECT, visibleRecipesWhere } from '$lib/server/recipeFeed'

const MAX_RESULTS = 8
// Rank a wider pool than we return, so the best matches aren't cut off alphabetically
const CANDIDATES = 100

/**
 * How well a name matches: 0 if it starts with the query, 1 if a word starts with it,
 * 2 if it only contains it somewhere.
 */
function matchRank(name, query) {
	const lower = name.toLowerCase()
	if (lower.startsWith(query)) return 0
	if (lower.split(/[^\p{L}\p{N}]+/u).some((word) => word.startsWith(query))) return 1
	return 2
}

/**
 * Quick recipe lookup by name, for the command palette.
 *
 * GET /api/recipe/lookup?q=chicken soup
 * Every word must appear in the name (case-insensitive). Only recipes the viewer may see
 * are searched. Results are ranked by how well the name matches, then the viewer's own
 * recipes first, then shorter names.
 *
 * Response: { results: Array<{ uid, name, mine, author, photos: [{ id }], image_url }> }
 * `author` is the owner's username, or null for the viewer's own recipes.
 */
export async function GET({ url, locals }) {
	const query = (url.searchParams.get('q') || '').trim().toLowerCase()
	const words = query.split(/\s+/).filter(Boolean).slice(0, 5)
	if (!words.length || words.join('').length < 2) return jsonSuccess({ results: [] })

	const user = getOptionalUser(locals)
	const recipes = await prisma.recipe.findMany({
		where: {
			...visibleRecipesWhere(user),
			AND: words.map((word) => ({ name: { contains: word } }))
		},
		orderBy: { name: 'asc' },
		take: CANDIDATES,
		select: {
			uid: true,
			name: true,
			image_url: true,
			userId: true,
			auth_user: { select: { username: true } },
			photos: PHOTO_SELECT
		}
	})

	const results = recipes
		.map(({ photos, userId, auth_user, ...recipe }) => {
			const mine = !!user && userId === user.userId
			return {
				...recipe,
				mine,
				author: mine ? null : (auth_user?.username ?? null),
				photos: mainPhoto(photos),
				rank: matchRank(recipe.name, query)
			}
		})
		.sort(
			(a, b) => a.rank - b.rank || Number(b.mine) - Number(a.mine) || a.name.length - b.name.length
		)
		.slice(0, MAX_RESULTS)
		.map(({ rank: _rank, ...recipe }) => recipe)

	return jsonSuccess({ results })
}
