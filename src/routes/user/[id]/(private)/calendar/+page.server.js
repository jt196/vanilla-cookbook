import { redirect } from '@sveltejs/kit'

/**
 * Server-side logic to load recipes for the page.
 * @returns {Promise<Object>} An object containing the recipes ordered by their creation date in descending order.
 */
export const load = async ({ url, fetch, locals }) => {
	let user = locals.user
	const logResponse = await fetch(`${url.origin}/api/user/${user.userId}/logs`)
	const logs = await logResponse.json()

	return {
		logs
	}
}
