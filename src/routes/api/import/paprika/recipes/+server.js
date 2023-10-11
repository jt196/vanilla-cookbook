import { fetchData } from '$lib/utils/import/paprika/paprikaAPI.js'
import path from 'path'
import { getJSONLength } from '$lib/utils/import/paprika/paprikaAPIUtils.js'
import { importPaprikaRecipes } from '$lib/utils/import/paprika/paprikaFileImport.js'

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
		await fetchData('recipes', paprikaUser, paprikaPassword, user.userId)
		return new Response(JSON.stringify({ success: 'Recipes fetched successfully.' }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		console.error('Error during fetchData:', error)
		return new Response(JSON.stringify({ error: 'Failed to fetch recipes.' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}

// If [userId]_recipes.json exists, how many items are in it
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
		const filePath = path.join(process.cwd(), 'uploads/imports', `${user.userId}_recipes.json`)
		const fileCount = await getJSONLength(filePath)

		return new Response(JSON.stringify({ fileCount }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		console.error('Error getting recipe count from JSON file:', error)

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
		const filename = user.userId + '_recipes.json'
		console.log('🚀 ~ file: +server.js:98 ~ PUT ~ filename:', filename)

		// Import recipes from .json file
		const importedCount = await importPaprikaRecipes(user.userId, filename)
		console.log('🚀 ~ file: +server.js:102 ~ PUT ~ importedCount:', importedCount)

		if (importedCount.count >= 0) {
			return new Response(
				JSON.stringify({
					success: importedCount.message,
					count: importedCount.count
				}),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
		} else {
			// Handle errors from the importPaprikaData function, if any
			return new Response(JSON.stringify({ error: 'Failed to import paprika data.' }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}
	} catch (error) {
		console.error('Error adding recipes to database:', error)

		return new Response(JSON.stringify({ error: 'Internal server error.' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
