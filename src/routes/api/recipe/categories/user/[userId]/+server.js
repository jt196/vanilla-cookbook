import { prisma } from '$lib/server/prisma'
import { buildHierarchy } from '$lib/utils/categories.js'
import { json } from '@sveltejs/kit'
import { sortByNameRecursive } from '$lib/utils/sorting.js'

// Handle GET request
export async function GET({ params, locals }) {
	const { session, user } = await locals.auth.validateUser()
	const { userId } = params
	if (!session || !user || user.userId != userId) {
		return {
			status: 401,
			body: { error: 'User not authenticated.' }
		}
	}
	try {
		const categories = await prisma.category.findMany({
			where: {
				userId: user.userId // Assuming you have a userId field in your Category model
			}
		})
		const sortedCategories = sortByNameRecursive(categories)
		const hierarchicalCategories = buildHierarchy(sortedCategories)
		return json(hierarchicalCategories)
	} catch (error) {
		return {
			status: 500,
			body: { error: 'Failed to fetch categories.' }
		}
	}
}
