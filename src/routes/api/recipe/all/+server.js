import { getOptionalUser, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { loadRecipeFeed, visibleRecipesWhere } from '$lib/server/recipeFeed'

/**
 * Feed cards for every recipe the viewer can see (own + public; admins see all), newest
 * first.
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
export async function GET({ locals }) {
	const user = getOptionalUser(locals)
	try {
		return jsonSuccess(await loadRecipeFeed(visibleRecipesWhere(user), user))
	} catch (err) {
		console.error('Error fetching recipes:', err)
		return jsonError(500, {
			error: `Failed to fetch recipes: ${err.message}`,
			code: 'recipe.msg.listLoadFail'
		})
	}
}
