import { redirect } from '@sveltejs/kit'

/**
 * Server-side logic to load recipes for the page.
 * @returns {Promise<Object>} An object containing the recipes ordered by their creation date in descending order.
 */
export const load = async ({ url, fetch, locals }) => {
	const session = await locals.auth.validate()
	const user = session?.user
	if (!session || !user) {
		redirect(302, '/login');
	}
	const shoppingListResponse = await fetch(`${url.origin}/api/ingredients/shopping`)
	const shoppingList = await shoppingListResponse.json()

	return {
		shoppingList
	}
}
