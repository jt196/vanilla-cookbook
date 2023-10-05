import { fetchData } from '$lib/utils/import/paprika/paprikaAPI.js'

export async function POST({ request, locals }) {
	const { session, user } = await locals.auth.validateUser()
	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	const { paprikaUser, paprikaPassword } = await request.json()
	try {
		await fetchData('categories', paprikaUser, paprikaPassword, user.userId)
		return new Response(JSON.stringify({ success: 'Categories fetched successfully.' }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: `Error fetching categories: ${error.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
