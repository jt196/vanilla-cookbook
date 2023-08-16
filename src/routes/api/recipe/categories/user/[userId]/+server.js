import { prisma } from '$lib/server/prisma'
import { buildHierarchy } from '$lib/utils/categories.js'
import { sortByNameRecursive } from '$lib/utils/sorting.js'

// Handle GET request
export async function GET({ params, locals }) {
	const { session, user } = await locals.auth.validateUser()
	const { userId } = params
	if (!session || !user || user.userId != userId) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), { status: 401 })
	}
	try {
		const categories = await prisma.category.findMany({
			where: {
				userId: user.userId // Assuming you have a userId field in your Category model
			}
		})
		const sortedCategories = sortByNameRecursive(categories)
		const hierarchicalCategories = buildHierarchy(sortedCategories)
		return new Response(JSON.stringify(hierarchicalCategories), { status: 200 })
	} catch (error) {
		console.error(error)
		return new Response(JSON.stringify({ error: 'Failed to fetch categories.' }), { status: 500 })
	}
}
