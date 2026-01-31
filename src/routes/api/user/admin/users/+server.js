import { prisma } from '$lib/server/prisma'
import { requireAdmin, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function GET({ locals }) {
	requireAdmin(locals)

	try {
		const usersWithRecipeCount = await prisma.authUser.findMany({
			select: {
				id: true,
				name: true,
				username: true,
				email: true,
				about: true,
				units: true,
				publicProfile: true,
				publicRecipes: true,
				skipSmallUnits: true,
				isAdmin: true,
				isRoot: true,
				ingMatch: true,
				ingOriginal: true,
				ingExtra: true,
				ingSymbol: true,
				language: true,
				theme: true,
				useCats: true,
				_count: {
					select: {
						recipes: true
					}
				}
			}
		})

		const users = usersWithRecipeCount.map((user) => {
			const { _count, ...restOfUser } = user
			return {
				...restOfUser,
				recipesCount: _count.recipes
			}
		})
		return jsonSuccess(users)
	} catch (error) {
		return jsonError(500, `Failed to fetch users: ${error.message}`)
	}
}
