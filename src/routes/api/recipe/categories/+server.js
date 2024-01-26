import { prisma } from '$lib/server/prisma'

// Create a new category
export const POST = async ({ request, locals }) => {
	const session = await locals.auth.validate()
	const user = session.user
	const bodyText = await request.text()
	const categoryData = JSON.parse(bodyText)

	if (!session || !user) {
		return {
			status: 401,
			body: { error: 'User not authenticated.' }
		}
	}

	try {
		const newCategory = await prisma.category.create({
			data: {
				name: categoryData.name,
				userId: user.userId,
				parent_uid: categoryData.parent_uid || null
			}
		})

		return new Response(JSON.stringify(newCategory), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response('Failed to create new category!', {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
