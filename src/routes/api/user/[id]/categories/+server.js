import { prisma } from '$lib/server/prisma'
import { buildHierarchy } from '$lib/utils/categories.js'
import { sortByNameRecursive } from '$lib/utils/sorting.js'

// Handle GET request
export async function GET({ params, locals }) {
	const session = await locals.auth.validate()
	const user = session.user
	const { id } = params
	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated or not authorized.' }), {
			status: 403,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
	try {
		const categories = await prisma.category.findMany({
			where: {
				userId: id // Assuming you have a userId field in your Category model
			}
		})
		const sortedCategories = sortByNameRecursive(categories)
		const hierarchicalCategories = buildHierarchy(sortedCategories)
		// return new Response(JSON.stringify(hierarchicalCategories), { status: 200 })
		return new Response(JSON.stringify(hierarchicalCategories), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		console.error(error)
		return new Response(JSON.stringify({ error: 'Failed to fetch categories.' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
