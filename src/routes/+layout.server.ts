import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate()
	const { user } = await locals.auth.validateUser()
	return { user }
}
