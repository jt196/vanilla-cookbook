import { prisma } from '$lib/server/prisma'
import { getOptionalUser, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function GET({ locals }) {
	const user = getOptionalUser(locals)

	const whereClause = user?.isAdmin ? {} : { publicProfile: true }

	try {
		const [usersWithPublicCount, usersWithTotalCount] = await prisma.$transaction([
			prisma.authUser.findMany({
				where: whereClause,
				select: {
					id: true,
					username: true,
					_count: {
						select: {
							recipes: { where: { is_public: true } }
						}
					}
				}
			}),
			prisma.authUser.findMany({
				where: whereClause,
				select: {
					id: true,
					_count: { select: { recipes: true } }
				}
			})
		])

		const mergedUsers = usersWithPublicCount.map((u) => {
			const totalCount = usersWithTotalCount.find((t) => t.id === u.id)?._count.recipes || 0
			return {
				id: u.id,
				username: u.username,
				publicRecipesCount: u._count.recipes,
				totalRecipesCount: totalCount
			}
		})

		return jsonSuccess(mergedUsers)
	} catch (err) {
		return jsonError(500, `Failed to fetch users: ${err.message}`)
	}
}
