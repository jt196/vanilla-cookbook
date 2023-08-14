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
	const updatedCategory = JSON.parse(bodyText)

	try {
		let updateData = {}

		// Check if name is present in the request and add to update data
		if (updatedCategory.name) {
			updateData.name = updatedCategory.name
		}

		// Check if parent_uid is present in the request and add to update data
		if ('parent_uid' in updatedCategory) {
			// Using 'in' to allow null values for root items
			updateData.parent_uid = updatedCategory.parent_uid
		}

		console.log('🚀 ~ file: +server.js:38 ~ POST ~ updateData:', updateData)

		await prisma.category.update({
			where: { uid: updatedCategory.uid },
			data: updateData
		})

		return new Response(JSON.stringify(updateData), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response('Failed to update', {
			status: 500,
			headers: {
				'Content-Type': 'text/plain'
			}
		})
	}
}
