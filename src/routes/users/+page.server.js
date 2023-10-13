/**
 * Server-side logic to load public users for the page.
 * @returns {Promise<Object>} An object containing the recipes ordered by their creation date in descending order.
 */
export const load = async ({ url, fetch }) => {
	const usersResponse = await fetch(`${url.origin}/api/site/users`)
	const users = await usersResponse.json()

	return {
		users
	}
}
