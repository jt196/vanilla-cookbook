import { prisma } from '$lib/server/prisma'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function POST({ request, locals }) {
	const user = requireAuth(locals)
	const bodyText = await request.text()
	const categoryData = JSON.parse(bodyText)

	try {
		const newCategory = await prisma.category.create({
			data: {
				name: categoryData.name,
				userId: user.userId,
				parent_uid: categoryData.parent_uid || null
			}
		})

		return jsonSuccess(newCategory)
	} catch (err) {
		return jsonError(500, 'Failed to create new category!')
	}
}
