import { redirect } from '@sveltejs/kit'

export function load({ url }) {
	const suffix = `${url.search}${url.hash}`
	throw redirect(307, `/recipe/new${suffix}`)
}
