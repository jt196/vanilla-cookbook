import path from 'path'
import fs from 'fs/promises'

export async function POST({ request, locals }) {
	const session = await locals.auth.validate()
	const user = session.user

	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	const { filename } = await request.json()
	const filepath = path.join(process.cwd(), 'uploads/imports', user.userId + '_' + filename)
	try {
		await fs.access(filepath, fs.constants.F_OK) // checks if the file exists
		return new Response(JSON.stringify({ exists: true }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(JSON.stringify({ exists: false }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}

export async function DELETE({ request, locals }) {
	const session = await locals.auth.validate()
	const user = session.user

	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	const { filename } = await request.json()
	const filepath = path.join(process.cwd(), 'uploads/imports', user.userId + '_' + filename)

	try {
		await fs.unlink(filepath) // this will delete the file
		try {
			await fs.access(filepath, fs.constants.F_OK)
			// If we reach here, it means file still exists
			return new Response(
				JSON.stringify({ success: false, error: 'File still exists after deletion.' }),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
		} catch (error) {
			// File is indeed deleted
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}
	} catch (error) {
		console.error(`Error deleting the file ${filepath}:`, error)
		return new Response(JSON.stringify({ success: false, error: error.message }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
