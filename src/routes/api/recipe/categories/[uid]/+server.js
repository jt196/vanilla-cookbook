import { prisma } from '$lib/server/prisma'

// Handle delete request
export async function DELETE({ params, locals }) {
	const { session, user } = await locals.auth.validateUser()
	const { uid } = params

	if (!session || !user) {
		return new Response('User not authenticated', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	// Check if the category's user ID matches the request user ID
	const category = await prisma.category.findUnique({
		where: { uid: uid }
	})

	if (!category || category.userId !== user.userId) {
		return new Response('Unauthorized to delete this category.', {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
	try {
		await prisma.category.delete({
			where: { uid: uid }
		})
		return new Response(
			{ message: 'Category deleted successfully', uid: uid },
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	} catch (error) {
		return new Response(
			{ error: `Failed to delete category: ${error.message}` },
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}
}

// Handle post request to update an existing category
export const POST = async ({ request, locals, params }) => {
	const { session, user } = await locals.auth.validateUser()
	const bodyText = await request.text()
	const categoryData = JSON.parse(bodyText)
	const { uid } = params

	if (!session || !user) {
		return new Response('User not authenticated!', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		const category = await prisma.category.findUnique({
			where: { uid: uid }
		})

		if (!category) {
			return new Response('Category not found!', {
				status: 404,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		if (category.userId !== user.userId) {
			return new Response('Unauthorised to update this category!', {
				status: 401,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		const updatedCategory = await prisma.category.update({
			where: { uid: uid },
			data: {
				name: categoryData.name || category.name,
				parent_uid: 'parent_uid' in categoryData ? categoryData.parent_uid : category.parent_uid
			}
		})

		return new Response(JSON.stringify(updatedCategory), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(
			{ error: `Failed to update category: ${error.message}` },
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}
}
