import { prisma } from '$lib/server/prisma'

export async function GET({ locals }) {
	const session = await locals.auth.validate()
	const user = session?.user
	let users
	// Build the where clause conditionally.
	const whereClause = user?.isAdmin ? {} : { publicProfile: true }

	try {
		users = await prisma.authUser.findMany({
			where: whereClause,
			select: {
				id: true,
				username: true,
				name: true,
				_count: {
					select: {
						recipes: {
							where: { is_public: true }
						}
					}
				}
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
	return new Response(JSON.stringify(users), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	})
}
