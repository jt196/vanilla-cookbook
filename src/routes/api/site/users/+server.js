import { prisma } from '$lib/server/prisma'

export async function GET() {
	try {
		const users = await prisma.authUser.findMany({
			where: {
				publicProfile: true
			}
		})
		return new Response(JSON.stringify(users), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: `Failed to fetch users: ${error.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
