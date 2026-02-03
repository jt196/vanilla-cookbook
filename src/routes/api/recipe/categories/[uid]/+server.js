import { prisma } from '$lib/server/prisma'
import { buildHierarchy } from '$lib/utils/categories.js'
import {
	requireAuth,
	requireOwnership,
	getOptionalUser,
	jsonSuccess,
	jsonError
} from '$lib/server/authHelpers'
import { normalizeString } from '$lib/utils/normalize'

export async function DELETE({ params, locals }) {
	const user = requireAuth(locals)
	const { uid } = params

	try {
		const category = await prisma.category.findUnique({
			where: { uid }
		})

		requireOwnership(user, category)

		await prisma.category.delete({
			where: { uid }
		})

		return jsonSuccess({ message: 'Category deleted successfully', uid })
	} catch (err) {
		if (err.status) throw err
		return jsonError(500, `Failed to delete category: ${err.message}`)
	}
}

export async function POST({ request, locals, params }) {
	const user = requireAuth(locals)
	const bodyText = await request.text()
	const categoryData = JSON.parse(bodyText)
	const { uid } = params

	try {
		const category = await prisma.category.findUnique({
			where: { uid }
		})

		requireOwnership(user, category)

		const updatedCategory = await prisma.category.update({
			where: { uid },
			data: {
				name: normalizeString(categoryData.name) ?? category.name,
				parent_uid: 'parent_uid' in categoryData ? categoryData.parent_uid : category.parent_uid
			}
		})

		return jsonSuccess(updatedCategory)
	} catch (err) {
		if (err.status) throw err
		return jsonError(500, `Failed to update category: ${err.message}`)
	}
}

export async function GET({ params, locals }) {
	const user = getOptionalUser(locals)
	const { uid } = params

	const recipe = await prisma.recipe.findFirst({
		where: { uid },
		select: { is_public: true }
	})

	const isPublic = recipe?.is_public ?? false

	if (!isPublic && !user) {
		return jsonError(401, 'User not authenticated.')
	}

	try {
		const recipeCategories = await prisma.recipeCategory.findMany({
			where: { recipeUid: uid },
			select: { category: true }
		})

		const categories = recipeCategories.map((rc) => ({ ...rc.category, selected: true }))
		const categoryMap = new Map(categories.map((category) => [category.uid, category]))

		for (let category of categories) {
			let currentCategory = category
			while (currentCategory.parent_uid) {
				const parentCategory = await prisma.category.findUnique({
					where: { uid: currentCategory.parent_uid }
				})

				if (!parentCategory) break

				if (!categoryMap.has(parentCategory.uid)) {
					categoryMap.set(parentCategory.uid, { ...parentCategory, selected: false })
				}

				currentCategory = parentCategory
			}
		}

		const uniqueCategories = Array.from(categoryMap.values())
		const hierarchicalCategories = buildHierarchy(uniqueCategories)

		return jsonSuccess(hierarchicalCategories)
	} catch (err) {
		return jsonError(500, `Failed to fetch categories: ${err.message}`)
	}
}
