import { prisma } from '$lib/server/prisma'
import { buildHierarchy } from '$lib/utils/categories.js'

// Handle delete request
export async function DELETE({ params, locals }) {
	const session = await locals.auth.validate()
	const user = session?.user
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
			status: 403,
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
	const session = await locals.auth.validate()
	const user = session?.user
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
		return new Response(JSON.stringify({ error: `Failed to update category: ${error.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}

// Handle GET request
export async function GET({ params, locals }) {
	const session = await locals.auth.validate()
	const user = session?.user
	const { uid } = params

	const recipe = await prisma.recipe.findFirst({
		where: {
			uid: uid
		},
		select: {
			is_public: true
		}
	})

	const isPublic = recipe?.is_public ?? false

	if (!isPublic && (!session || !user)) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		// Fetch the recipe's categories
		const recipeCategories = await prisma.recipeCategory.findMany({
			where: {
				recipeUid: uid
			},
			select: {
				category: true
			}
		})

		const categories = recipeCategories.map((rc) => ({ ...rc.category, selected: true }))
		const categoryMap = new Map(categories.map((category) => [category.uid, category]))

		// Recursively fetch parent categories
		for (let category of categories) {
			let currentCategory = category
			while (currentCategory.parent_uid) {
				const parentCategory = await prisma.category.findUnique({
					where: {
						uid: currentCategory.parent_uid
					}
				})

				if (!parentCategory) break // Stop if parent not found

				// Add the parent category if it doesn't already exist in the map
				if (!categoryMap.has(parentCategory.uid)) {
					categoryMap.set(parentCategory.uid, { ...parentCategory, selected: false })
				}

				currentCategory = parentCategory
			}
		}

		const uniqueCategories = Array.from(categoryMap.values())
		const hierarchicalCategories = buildHierarchy(uniqueCategories)

		// TODO: #41 Make this into a get categories function for reuse

		return new Response(JSON.stringify(hierarchicalCategories), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: `Failed to fetch categories: ${error.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
