import { prisma } from '$lib/server/prisma'

// Handle recipe log updates
export async function PUT({ locals, request, params }) {
	const session = await locals.auth.validate()
	const user = session?.user

	const { id } = params
	if (!session || !user) {
		return new Response('User not authenticated!', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	// Parse the request body to get updated fields
	const body = await request.json()
	const { start, end } = body

	const log = await prisma.RecipeLog.findUnique({
		where: {
			id: id
		}
	})

	if (log.userId !== user.userId) {
		return new Response(JSON.stringify({ error: 'Log does not belong to authenticated user.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	let updatedLog
	try {
		// Update the RecipeLog entry
		updatedLog = await prisma.RecipeLog.update({
			where: { id: id },
			data: {
				cooked: new Date(start),
				cookedEnd: end ? new Date(end) : undefined // Only update cookedEnd if provided
			}
		})
	} catch (err) {
		console.error('Error updating recipe log:', err)
		return new Response(JSON.stringify({ error: `Failed to update recipe log: ${err.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	// Return the updated log entry
	return new Response(JSON.stringify({ updatedLog }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	})
}

// Handle recipe log deletion
export async function DELETE({ locals, params }) {
	const session = await locals.auth.validate()
	const user = session?.user

	const { id } = params // Assuming `id` is the URL parameter for the log's ID
	if (!session || !user) {
		return new Response('User not authenticated!', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		const log = await prisma.RecipeLog.findUnique({
			where: {
				id: id
			}
		})
		if (log.userId !== user.userId) {
			return new Response(JSON.stringify({ error: 'Log does not belong to authenticated user.' }), {
				status: 401,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}
		await prisma.RecipeLog.delete({
			where: {
				id: id
			}
		})
	} catch (err) {
		console.error('Error updating recipe log:', err)
		return new Response(JSON.stringify({ error: `Failed to delete recipe log: ${err.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	// Return the updated log entry
	return new Response(JSON.stringify({ deleted: id }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	})
}
