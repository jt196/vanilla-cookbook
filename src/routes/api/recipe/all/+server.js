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
		if (user && recipes.length > 0) {
			const favs = await prisma.recipeFavorite.findMany({
				where: {
					userId: user.userId,
					recipeUid: { in: recipes.map((recipe) => recipe.uid) }
				},
				select: {
					recipeUid: true
				}
			})
			favouriteLookup = new Set(favs.map((fav) => fav.recipeUid))
		}

		const updatedRecipes = recipes.map((recipe) => {
			const mainOrFirstPhoto = recipe.photos[0] || null
			return {
				...recipe,
				on_favorites: favouriteLookup.has(recipe.uid),
				photos: mainOrFirstPhoto ? [mainOrFirstPhoto] : []
			}
		})

		return jsonSuccess(updatedRecipes)
	} catch (err) {
		console.error('Error fetching recipes:', err)
		return jsonError(500, `Failed to fetch recipes: ${err.message}`)
	}
}
