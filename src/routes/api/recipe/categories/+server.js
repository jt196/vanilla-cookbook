// src/routes/api/recipe/categories/+server.js

import { prisma } from '$lib/server/prisma'
import { buildHierarchy } from '$lib/utils/categories.js'
import { json } from '@sveltejs/kit'

// Handle GET request
export async function GET() {
	try {
		const categories = await prisma.category.findMany()
		const hierarchicalCategories = buildHierarchy(categories)
		return json(hierarchicalCategories)
	} catch (error) {
		return {
			status: 500,
			body: { error: 'Failed to fetch categories.' }
		}
	}
}

// Handle POST request
export const POST = async ({ request }) => {
	const bodyText = await request.text()
	const categoryData = JSON.parse(bodyText)
	console.log('🚀 ~ file: +server.js:25 ~ POST ~ categoryData:', categoryData)

	try {
		let responseData

		// If uid is not present, create a new category
		if (!categoryData.uid) {
			const newCategory = await prisma.category.create({
				data: {
					name: categoryData.name,
					// You can set other default values here if needed
					parent_uid: categoryData.parent_uid || null // This allows for top-level categories
				}
			})
			console.log('🚀 ~ file: +server.js:40 ~ POST ~ newCategory:', newCategory)
			responseData = newCategory
		} else {
			// Update existing category
			let updateData = {}

			// Check if name is present in the request and add to update data
			if (categoryData.name) {
				updateData.name = categoryData.name
			}

			// Check if parent_uid is present in the request and add to update data
			if ('parent_uid' in categoryData) {
				// Using 'in' to allow null values for root items
				updateData.parent_uid = categoryData.parent_uid
			}

			await prisma.category.update({
				where: { uid: categoryData.uid },
				data: updateData
			})
			responseData = updateData
		}

		return new Response(JSON.stringify(responseData), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response('Failed to process category data', {
			status: 500,
			headers: {
				'Content-Type': 'text/plain'
			}
		})
	}
}
