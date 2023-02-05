import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({ locals }) => {
	const { user, session } = await locals.validateUser()
	return { user }
}
