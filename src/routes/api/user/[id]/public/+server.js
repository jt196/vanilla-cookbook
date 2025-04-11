import { prisma } from '$lib/server/prisma'

export async function GET({ params }) {
	// Destructure the user ID from the URL params
	const { id } = params

	try {
		// Count the number of recipes for this user
		const userProfile = await prisma.authUser.findUnique({
			where: { id: id },
			select: {
				username: true,
				id: true,
				publicProfile: true
			}
		})

		return new Response(JSON.stringify({ userProfile }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		console.error('Error counting recipes:', error)

		return new Response(JSON.stringify({ error: 'Internal server error.' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
