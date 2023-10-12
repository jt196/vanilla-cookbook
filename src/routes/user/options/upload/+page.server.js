import { error } from '@sveltejs/kit'

// eslint-disable-next-line no-unused-vars
export const load = async ({ url, fetch, locals }) => {
	const { session, user } = await locals.auth.validateUser()

	if (!session || !user) {
		throw error(401, 'Unauthorized')
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
		paprikarecipesFiles
	}
}
