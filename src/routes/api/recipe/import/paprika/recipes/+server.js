import { fetchData } from '$lib/utils/import/paprika/paprikaAPI.js'
import path from 'path'
import { getJSONLength } from '$lib/utils/import/paprika/paprikaAPIUtils.js'
import { importPaprikaRecipes } from '$lib/utils/import/paprika/paprikaFileImport.js'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function POST({ request, locals }) {
	const user = requireAuth(locals)

	const { paprikaUser, paprikaPassword } = await request.json()
	try {
		await fetchData('recipes', paprikaUser, paprikaPassword, user.userId)
		return jsonSuccess({ success: 'Recipes fetched successfully.' })
	} catch (err) {
		console.error('Error during fetchData:', err)
		return jsonError(500, 'Failed to fetch recipes.')
	}
}

export async function GET({ locals }) {
	const user = requireAuth(locals)

	try {
		const filePath = path.join(process.cwd(), 'uploads/imports', `${user.userId}_recipes.json`)
		const fileCount = await getJSONLength(filePath)

		return jsonSuccess({ fileCount })
	} catch (err) {
		console.error('Error getting recipe count from JSON file:', err)

		if (err.code === 'ENOENT') {
			return jsonSuccess({ fileCount: 0 })
		} else {
			return jsonError(500, 'Internal server error.')
		}
	}
}

export async function PUT({ request, locals }) {
	const user = requireAuth(locals)

	const bodyText = await request.text()
	const isPublic = JSON.parse(bodyText).isPublic

	try {
		const filename = user.userId + '_recipes.json'
		const importedCount = await importPaprikaRecipes(user.userId, filename, isPublic)
		if (importedCount.count >= 0) {
			return jsonSuccess({
				success: importedCount.message,
				count: importedCount.count
			})
		} else {
			return jsonError(500, 'Failed to import paprika data.')
		}
	} catch (err) {
		console.error('Error adding recipes to database:', err)
		return jsonError(500, 'Internal server error.')
	}
}
