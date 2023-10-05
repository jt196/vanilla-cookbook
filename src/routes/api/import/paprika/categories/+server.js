import { fetchData } from '$lib/utils/import/paprika/paprikaAPI.js'
import { getJSONLength } from '$lib/utils/import/paprika/paprikaFileImport.js'
import path from 'path'

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

export async function GET({ locals }) {
	// Validate the logged-in user from the Lucia locals object
	const { user, session } = await locals.auth.validateUser()
	if (!user || !session) {
		return new Response(JSON.stringify({ error: 'User not authenticated or wrong user.' }), {
			status: 403,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		// Get the count from the JSON file
		const filePath = path.join(
			process.cwd(),
			'src/lib/data/import',
			`${user.userId}_categories.json`
		)
		const fileCount = await getJSONLength(filePath)
		console.log('🚀 ~ file: +server.js:58 ~ GET ~ fileCount:', fileCount)
		console.log('🚀 ~ file: +server.js:54 ~ GET ~ filePath:', filePath)

		return new Response(JSON.stringify({ fileCount }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		console.error('Error getting category count from JSON file:', error)

		return new Response(JSON.stringify({ error: 'Internal server error.' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
