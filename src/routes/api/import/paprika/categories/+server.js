import { fetchData } from '$lib/utils/import/paprika/paprikaAPI.js'
import path from 'path'
import {
	addCategoriesToDB,
	loadCategories,
	getJSONLength
} from '$lib/utils/import/paprika/paprikaAPIUtils.js'

// Grab the Paprika categories from their API
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
		console.error('Error during fetchData:', error)
		return new Response(JSON.stringify({ error: 'Failed to fetch categories.' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}

// If [userId]_categories.json exists, how many items are in it
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
		const filePath = path.join(process.cwd(), 'uploads/imports', `${user.userId}_categories.json`)
		const fileCount = await getJSONLength(filePath)

		return new Response(JSON.stringify({ fileCount }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		console.error('Error getting category count from JSON file:', error)
		if (error.code === 'ENOENT') {
			// File not found
			return new Response(JSON.stringify({ fileCount: 0 }), {
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		} else {
			return new Response(JSON.stringify({ error: 'Internal server error.' }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}
	}
}

export async function PUT({ locals }) {
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
		const filepath = path.join(process.cwd(), 'uploads/imports', user.userId + '_categories.json')
		// Load categories using the utility function
		const categories = await loadCategories(filepath)

		// If no categories are returned or the list is empty, respond appropriately
		if (!categories || categories.length === 0) {
			return new Response(JSON.stringify({ error: 'No categories found to import.' }), {
				status: 400,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		// Call the function to add categories to the database
		await addCategoriesToDB(categories, user.userId)

		return new Response(
			JSON.stringify({ success: true, message: 'Categories added to the database.' }),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	} catch (error) {
		console.error('Error adding categories to database:', error)

		return new Response(JSON.stringify({ error: 'Internal server error.' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
