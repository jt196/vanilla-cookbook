import { redirect } from '@sveltejs/kit'

/**
 * Legacy /new URL: redirect to /recipe/new, keeping the query string (used by the
 * bookmarklet and share target).
 *
 * @param {import('./$types').PageServerLoadEvent} event
 */
export function load({ url }) {
	const suffix = `${url.search}${url.hash}`
	throw redirect(307, `/recipe/new${suffix}`)
}
