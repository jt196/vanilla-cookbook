import { handleHooks } from "@lucia-auth/sveltekit"
import { auth } from "$lib/server/lucia"
import type { Handle } from "@sveltejs/kit"
import { sequence } from "@sveltejs/kit/hooks"

export const customHandle: Handle = async ({ resolve, event }) => {
	return resolve(event)
}

export const handle: Handle = sequence(handleHooks(auth), customHandle)
