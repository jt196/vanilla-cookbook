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
			select: {
				uid: true,
				name: true,
				image_url: true,
				ingredients: true,
				source: true,
				source_url: true,
				prep_time: true,
				cook_time: true,
				total_time: true,
				servings: true,
				rating: true,
				created: true,
				is_public: true,
				is_pinned: true,
				in_trash: true,
				on_favorites: true,
				parentRecipeId: true,
				userId: true,
				auth_user: {
					select: {
						id: true,
						username: true
					}
				},
				categories: {
					select: {
						category: {
							select: {
								name: true,
								uid: true
							}
						}
					}
				},
				log: true,
				photos: {
					orderBy: [{ isMain: 'desc' }, { id: 'asc' }],
					select: {
						id: true,
						fileType: true,
						url: true
					}
				}
			}
		})

		let favouriteLookup = new Set()
		let forkLookup = new Set()
		if (user && recipes.length > 0) {
			const recipeUids = recipes.map((recipe) => recipe.uid)

			// Run favorites and forks queries in parallel
			const [favs, forks] = await Promise.all([
				prisma.recipeFavorite.findMany({
					where: {
						userId: user.userId,
						recipeUid: { in: recipeUids }
					},
					select: { recipeUid: true }
				}),
				prisma.recipe.findMany({
					where: {
						userId: user.userId,
						parentRecipeId: { in: recipeUids }
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
