// src/routes/user/+layout.server.js
import { prisma } from '$lib/server/prisma'
import { requireUser, requireUserMatch } from '$lib/server/authPage'

/**
 * Private user pages: requires the logged-in user to match the URL, and provides their
 * recipe counts and the app version.
 *
 * @type {import('./$types').LayoutServerLoad}
 */
export const load = async ({ locals, params }) => {
	const id = params.id
	const user = requireUser(locals)
	requireUserMatch(user, id)

	const [dbRecordCount, publicCount, privateCount, cookedCount, favouritesCount] =
		await Promise.all([
			prisma.recipe.count({ where: { userId: user.userId } }),
			prisma.recipe.count({ where: { userId: user.userId, is_public: true } }),
			prisma.recipe.count({
				where: { userId: user.userId, OR: [{ is_public: false }, { is_public: null }] }
			}),
			prisma.recipe.count({ where: { userId: user.userId, log: { some: {} } } }),
			prisma.recipe.count({ where: { userId: user.userId, on_favorites: true } })
		])

	return {
		user,
		dbRecordCount,
		recipeStats: {
			total: dbRecordCount,
			public: publicCount,
			private: privateCount,
			cooked: cookedCount,
			favourites: favouritesCount
		},
		version: process.env.GIT_VERSION || 'Dev Version'
	}
}
