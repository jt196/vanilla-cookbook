import { error } from '@sveltejs/kit'

// eslint-disable-next-line no-unused-vars
export const load = async ({ url, fetch, locals }) => {
	const session = await locals.auth.validate()
	const user = session?.user

	if (!session || !user) {
		throw error(401, 'Unauthorized')
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

	let paprikarecipesFiles = []

	try {
		const response = await fetch(`/api/import/paprika/paprikarecipes`)
		const data = await response.json()
		if (data && data.files) {
			paprikarecipesFiles = data.files
		}
	} catch (err) {
		console.error('Error fetching category file count:', err)
		// You might want to handle this error differently based on your application's needs
	}

	return {
		user,
		paprikarecipesFiles,
		dbRecCount
	}
}
