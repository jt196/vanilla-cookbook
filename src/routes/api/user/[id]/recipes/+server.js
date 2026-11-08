import { getOptionalUser, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { loadRecipeFeed, userRecipesWhere } from '$lib/server/recipeFeed'

/**
 * Feed cards for a user's recipes: the owner also sees public recipes they've favourited;
 * others see only public ones.
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
export async function GET({ params, locals }) {
	const user = getOptionalUser(locals)
	try {
		return jsonSuccess(await loadRecipeFeed(userRecipesWhere(params.id, user), user))
	} catch (err) {
		console.error('Error fetching recipes:', err)
		return jsonError(500, {
			error: `Failed to fetch recipes: ${err.message}`,
			code: 'users.msg.recipesLoadFail'
		})
	}
}
