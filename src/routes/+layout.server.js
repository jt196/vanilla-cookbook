// src/routes/+layout.server.js
export const load = async ({ locals }) => {
	// this loader should not redirect; just provide data
	return {
		user: locals.user,
		settings: locals.site.settings,
		dbSeed: locals.site.dbSeeded
	}
}
