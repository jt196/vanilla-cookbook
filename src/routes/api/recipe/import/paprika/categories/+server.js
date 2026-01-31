import { fetchData } from '$lib/utils/import/paprika/paprikaAPI.js'
import path from 'path'
import {
	addCategoriesToDB,
	loadCategories,
	getJSONLength
} from '$lib/utils/import/paprika/paprikaAPIUtils.js'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function POST({ request, locals }) {
	const user = requireAuth(locals)

	const { paprikaUser, paprikaPassword } = await request.json()
	try {
		await fetchData('categories', paprikaUser, paprikaPassword, user.userId)
		return jsonSuccess({ success: 'Categories fetched successfully.' })
	} catch (err) {
		console.error('Error during fetchData:', err)
		return jsonError(500, 'Failed to fetch categories.')
	}
}

export async function GET({ locals }) {
	const user = requireAuth(locals)

	try {
		const filePath = path.join(process.cwd(), 'uploads/imports', `${user.userId}_categories.json`)
		const fileCount = await getJSONLength(filePath)

		return jsonSuccess({ fileCount })
	} catch (err) {
		console.error('Error getting category count from JSON file:', err)
		if (err.code === 'ENOENT') {
			return jsonSuccess({ fileCount: 0 })
		} else {
			return jsonError(500, 'Internal server error.')
		}
	}
}

export async function PUT({ locals }) {
	const user = requireAuth(locals)

	try {
		const filepath = path.join(process.cwd(), 'uploads/imports', user.userId + '_categories.json')
		const categories = await loadCategories(filepath)

		if (!categories || categories.length === 0) {
			return jsonError(400, 'No categories found to import.')
		}

		await addCategoriesToDB(categories, user.userId)

		return jsonSuccess({ success: true, message: 'Categories added to the database.' })
	} catch (err) {
		console.error('Error adding categories to database:', err)
		return jsonError(500, 'Internal server error.')
	}
}
