export const load = async ({ fetch, url, locals }) => {
	const response = await fetch(`${url.origin}/api/recipe/all`)
	const recipes = await response.json()

	return {
		recipes,
		viewerUserId: locals.user?.userId ?? null,
		semanticAvailable: !!locals.site?.semantic?.enabled
	}
}
