// import { handleHooks } from "@lucia-auth/sveltekit"
import { auth } from '$lib/server/lucia'
import type { Handle } from '@sveltejs/kit'
// import { sequence } from "@sveltejs/kit/hooks"

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.auth = auth.handleRequest(event)
	return await resolve(event)
}
