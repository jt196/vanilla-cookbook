import { prisma } from '$lib/server/prisma'

export async function GET({ locals }) {
	const session = await locals.auth.validate()
	const user = session?.user

	// Build the where clause conditionally.
	const whereClause = user?.isAdmin ? {} : { publicProfile: true }

	try {
		// Execute both queries in a transaction for consistency
		const [usersWithPublicCount, usersWithTotalCount] = await prisma.$transaction([
			prisma.authUser.findMany({
				where: whereClause,
				select: {
					id: true,
					username: true,
					name: true,
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

		// Merge the two results by user ID
		const mergedUsers = usersWithPublicCount.map((user) => {
			const totalCount = usersWithTotalCount.find((u) => u.id === user.id)?._count.recipes || 0
			return {
				id: user.id,
				username: user.username,
				name: user.name,
				publicRecipesCount: user._count.recipes,
				totalRecipesCount: totalCount
			}
		})

		return new Response(JSON.stringify(mergedUsers), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: `Failed to fetch users: ${error.message}` }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}
