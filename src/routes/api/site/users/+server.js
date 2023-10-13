import { prisma } from '$lib/server/prisma'

export async function GET() {
	try {
		const users = await prisma.authUser.findMany({
			where: {
				publicProfile: true
			}
		})
		console.log('🚀 ~ file: +server.js:10 ~ GET ~ users:', users)
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
