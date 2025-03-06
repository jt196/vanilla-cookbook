// /api/recipe/[uid]/rating.js
import { prisma } from '$lib/server/prisma'

export async function PUT({ request, locals, params }) {
	const session = await locals.auth.validate()
	const user = session?.user
	const { uid } = params
	console.log('🚀 ~ PUT ~ uid:', uid)

	if (!session || !user) {
		return new Response('User not authenticated!', {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	try {
		const { rating } = await request.json()
		// Validate rating if needed
		const updatedRecipe = await prisma.recipe.update({
			where: { uid },
			data: { rating }
		})

		return new Response(JSON.stringify({ message: 'Rating updated', recipe: updatedRecipe }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: `Failed to update rating: ${error.message}` }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}
