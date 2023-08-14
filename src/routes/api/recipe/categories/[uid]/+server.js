import { prisma } from '$lib/server/prisma'

export async function DELETE({ params }) {
	const { uid } = params
	console.log('🚀 ~ file: +server.js:5 ~ DELETE ~ uid:', uid)

	if (!uid) {
		return new Response('UID is required', {
			status: 400,
			headers: {
				'Content-Type': 'text/plain'
			}
		})
	}

	try {
		// Delete the data item from the database
		const deletedCategory = await prisma.category.delete({
			where: { uid: uid }
		})

		if (!deletedCategory) {
			return new Response('Category not found', {
				status: 404,
				headers: {
					'Content-Type': 'text/plain'
				}
			})
		}

		return new Response(JSON.stringify({ message: 'Category deleted successfully', uid: uid }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(`An error occurred: ${error.message}`, {
			status: 500,
			headers: {
				'Content-Type': 'text/plain'
			}
		})
	}
}
