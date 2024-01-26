import { prisma } from '$lib/server/prisma'

export async function GET({ locals }) {
	const session = await locals.auth.validate()
	const user = session.user

	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	// Ensure the user is an admin
	if (!user.isAdmin) {
		return new Response(
			JSON.stringify({ error: 'Unauthorized! You must be an admin to view all users.' }),
			{
				status: 403,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}

	try {
		// const users = await prisma.authUser.findMany()
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
				_count: {
					select: {
						recipes: true
					}
				}
			}
		})

		// Modify users to include the recipes count and remove the _count key
		const users = usersWithRecipeCount.map((user) => {
			const { _count, ...restOfUser } = user
			return {
				...restOfUser,
				recipesCount: _count.recipes
			}
		})
		return new Response(JSON.stringify(users), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: `Failed to fetch users: ${error.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
