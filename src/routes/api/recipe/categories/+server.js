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
export async function POST(request) {
	const updatedNodes = request.body

	try {
		// Implement the logic to update the categories in the database
		// based on the updatedNodes data structure.
		// This might involve updating the order_flag, parent_uid, and possibly other fields.

		// For simplicity, I'm just showing a placeholder logic.
		// You'll need to expand on this to handle the actual updates.
		for (let node of updatedNodes) {
			await prisma.category.update({
				where: { uid: node.id },
				data: {
					// your update data here
				}
			})
		}

		return {
			status: 200,
			body: { message: 'Categories updated successfully.' }
		}
	} catch (error) {
		return {
			status: 500,
			body: { error: 'Failed to update categories.' }
		}
	}
}
