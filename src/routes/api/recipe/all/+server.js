import { prisma } from '$lib/server/prisma'
import { getOptionalUser, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function GET({ locals }) {
	const user = getOptionalUser(locals)

	let whereClause = { in_trash: false }

	if (user?.isAdmin) {
		whereClause = { in_trash: false }
	} else if (user) {
		whereClause = {
			in_trash: false,
			OR: [{ userId: user.userId }, { is_public: true }]
		}
	} else {
		whereClause = { in_trash: false, is_public: true }
	}

	try {
		const recipes = await prisma.recipe.findMany({
			where: whereClause,
			orderBy: {
				created: 'desc'
			},
			// Feed card + client-side search/sort only. Full ingredient/direction text,
			// times, per-recipe log rows and (deprecated) categories are not read here;
			// the recipe detail page loads those. `ingredients` is kept until search
			// moves server-side (phase 2) so client-side ingredient search keeps working.
			select: {
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
				auth_user: {
					select: {
						username: true
					}
				},
				log: {
					select: {
						cooked: true
					}
				},
				photos: {
					orderBy: [{ isMain: 'desc' }, { id: 'asc' }],
					select: {
						id: true
					}
				}
			}
		})

		let favouriteLookup = new Set()
		let forkLookup = new Set()
		if (user && recipes.length > 0) {
			// Fetch the viewer's own favourites and forks in full rather than filtering
			// by the loaded recipe UIDs. On the "All Recipes" view the UID list can run
			// to thousands of entries, which overflows SQLite's bound-parameter limit
			// (`recipeUid: { in: [...] }`). Both result sets are bounded by the viewer's
			// own activity, and the Set lookups below intersect them with the page.
			const [favs, forks] = await Promise.all([
				prisma.recipeFavorite.findMany({
					where: {
						userId: user.userId
					},
					select: { recipeUid: true }
				}),
				prisma.recipe.findMany({
					where: {
						userId: user.userId,
						parentRecipeId: { not: null }
					},
					select: { parentRecipeId: true }
				})
			])

			favouriteLookup = new Set(favs.map((fav) => fav.recipeUid))
			forkLookup = new Set(forks.map((fork) => fork.parentRecipeId).filter(Boolean))
		}

		const updatedRecipes = recipes.map((recipe) => {
			const mainOrFirstPhoto = recipe.photos[0] || null
			return {
				...recipe,
				on_favorites: favouriteLookup.has(recipe.uid),
				duplicatedByViewer: forkLookup.has(recipe.uid),
				photos: mainOrFirstPhoto ? [mainOrFirstPhoto] : []
			}
		})

		return jsonSuccess(updatedRecipes)
	} catch (err) {
		console.error('Error fetching recipes:', err)
		return jsonError(500, {
			error: `Failed to fetch recipes: ${err.message}`,
			code: 'recipe.msg.listLoadFail'
		})
	}
}
