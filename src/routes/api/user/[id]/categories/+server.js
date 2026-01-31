import { prisma } from '$lib/server/prisma'
import { error } from '@sveltejs/kit'
import { buildHierarchy } from '$lib/utils/categories.js'
import { sortByNameRecursive } from '$lib/utils/sorting.js'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function GET({ params, locals }) {
	const user = requireAuth(locals)
	const { id } = params

	if (user.userId !== id) {
		throw error(403, 'Unauthorized to view categories')
	}

	try {
		const categories = await prisma.category.findMany({
			where: { userId: id }
		})
		const sortedCategories = sortByNameRecursive(categories)
		const hierarchicalCategories = buildHierarchy(sortedCategories)

		return jsonSuccess(hierarchicalCategories)
	} catch (err) {
		console.error(err)
		return jsonError(500, 'Failed to fetch categories.')
	}
}
