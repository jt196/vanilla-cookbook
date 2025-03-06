import { error } from '@sveltejs/kit'

// eslint-disable-next-line no-unused-vars
export const load = async ({ url, fetch, locals }) => {
	const session = await locals.auth.validate()
	const user = session?.user

	if (!session || !user) {
		error(401, 'Unauthorized');
	}

	// Fetch the category count for the user
	let dbCategoryCount = 0
	try {
		const response = await fetch(`/api/user/${user.userId}/categories/count`)
		const data = await response.json()

		if (data && data.count) {
			dbCategoryCount = data.count
		}
	} catch (err) {
		console.error('Error fetching category db count:', err)
		// You might want to handle this error differently based on your application's needs
	}
	// Fetch the category count for the user
	let dbRecCount = 0
	try {
		const response = await fetch(`/api/user/${user.userId}/recipes/count`)
		const data = await response.json()
		if (data && data.count) {
			dbRecCount = data.count
		}
	} catch (err) {
		console.error('Error fetching recipe db count:', err)
		// You might want to handle this error differently based on your application's needs
	}

	let fileCategoryCount = 0
	try {
		const response = await fetch(`/api/import/paprika/categories`)
		const data = await response.json()
		if (data && data.fileCount) {
			fileCategoryCount = data.fileCount
		}
	} catch (err) {
		console.error('Error fetching category file count:', err)
		// You might want to handle this error differently based on your application's needs
	}
	let fileRecCount = 0
	try {
		const response = await fetch(`/api/import/paprika/recipes`)
		const data = await response.json()
		if (data && data.fileCount) {
			fileRecCount = data.fileCount
		}
	} catch (err) {
		console.error('Error fetching category file count:', err)
		// You might want to handle this error differently based on your application's needs
	}

	return {
		user,
		importCount: {
			catFile: fileCategoryCount,
			catDb: dbCategoryCount,
			recFile: fileRecCount,
			recDb: dbRecCount
		}
	}
}
