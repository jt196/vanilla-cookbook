/**
 * Server-side logic to load public users for the page.
 * @returns {Promise<Object>} An object containing the recipes ordered by their creation date in descending order.
 */
export const load = async ({ url, fetch, locals }) => {
	const session = await locals.auth.validate()
	const user = session?.user
	let viewingUser
	if (session || user) {
		viewingUser = user
	}
	const usersResponse = await fetch(`${url.origin}/api/site/users`)
	const users = await usersResponse.json()
	console.log('🚀 ~ load ~ users:', users)

	// Remove the user viewing from the list
	const noSelfUsers = users.filter((user) => user.id !== viewingUser?.userId)

	let filteredUsers

	// Filter users based on recipe count, admin user can see private recipes
	if (user?.isAdmin) {
		filteredUsers = noSelfUsers.filter((user) => user.totalRecipesCount > 0)
	} else {
		filteredUsers = noSelfUsers.filter((user) => user.publicRecipesCount > 0)
	}

	console.log('🚀 ~ load ~ filteredUsers:', filteredUsers)

	return {
		users,
		filteredUsers,
		userCount: filteredUsers.length
	}
}
