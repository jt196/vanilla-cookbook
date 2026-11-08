import { getOptionalUser, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { loadRecipeFeed, visibleRecipesWhere } from '$lib/server/recipeFeed'

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
