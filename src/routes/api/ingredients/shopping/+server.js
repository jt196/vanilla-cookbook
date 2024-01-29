import { prisma } from '$lib/server/prisma'

export async function POST({ request, locals }) {
	const session = await locals.auth.validate()
	const user = session.user
	console.log('🚀 ~ POST ~ user:', user)

	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	const bodyText = await request.text()
	const ingredient = JSON.parse(bodyText)

	try {
		// Use Prisma to add the ingredient to the shopping list, associated with a user
		const newItem = await prisma.shoppingListItem.create({
			data: {
				name: ingredient.ingredient,
				quantity: ingredient.quantity,
				userId: user.userId,
				unit: ingredient.quantity > 1 ? ingredient.unitPlural : ingredient.unit,
				...(ingredient.recipeUid && { recipeUid: ingredient.recipeUid })
			}
		})

		// Construct and return the response using the Response object
		return new Response(JSON.stringify(newItem), {
			status: 200, // HTTP status code
			headers: {
				'Content-Type': 'application/json' // Set the Content-Type header
			}
		})
	} catch (error) {
		// Handle potential errors, such as database issues
		console.error('Failed to add ingredient to shopping list:', error)

		// Return an error response
		return new Response(JSON.stringify({ error: 'Failed to add ingredient to shopping list' }), {
			status: 500, // Internal Server Error
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}

export const GET = async ({ locals }) => {
	const session = await locals.auth.validate()
	const user = session.user

	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
	try {
		const shoppingList = await prisma.shoppingListItem.findMany({
			orderBy: {
				name: 'desc'
			}
		})

		return new Response(JSON.stringify(shoppingList), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		console.error(error)
		return new Response(JSON.stringify({ error: 'Failed to fetch shopping list.' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}

export async function PATCH({ request, locals }) {
	const session = await locals.auth.validate()
	const user = session.user

	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	const bodyText = await request.text()
	const { uid, purchased, name, quantity, unit } = JSON.parse(bodyText)
	// Start constructing the data object with the purchased field
	let updateData = { purchased, name, quantity, unit }

	try {
		const updatedItem = await prisma.shoppingListItem.update({
			where: { uid },
			data: updateData
		})
		console.log('🚀 ~ PATCH ~ updatedItem:', updatedItem)

		return new Response(JSON.stringify(updatedItem), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		console.error('Failed to update shopping list item:', error)

		return new Response(JSON.stringify({ error: 'Failed to update shopping list item' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
