import { auth } from '$lib/server/lucia'
import { prisma } from '$lib/server/prisma'
import { fail, redirect } from '@sveltejs/kit'
import {
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	REGISTRATION_ALLOWED
} from '$env/static/private'
import Oauth from '$lib/components/Oauth.svelte'

// small helper: parse truthy envs
const envTrue = (v) => typeof v === 'string' && /^(true|1|yes|on)$/i.test(v.trim())

export const load = async ({ locals }) => {
	const user = locals.user
	if (user) {
		// use throw in SvelteKit to actually redirect
		throw redirect(302, '/')
	}

	const { settings, oauth } = locals.site

	if (!settings.registrationAllowed) {
		throw redirect(302, '/login')
	}

	return {
		settings,
		oauth
	}
}

export const actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData()
		const name = (formData.get('name') || '').toString().trim()
		const username = (formData.get('username') || '').toString().trim()
		const email = (formData.get('email') || '').toString().trim()
		const about = (formData.get('about') || '').toString().trim()
		const password = (formData.get('password') || '').toString()

		if (!name || !username || !email || !password) {
			return fail(400, { message: 'Please fill all required fields.' })
		}
		if (password.length < 8) {
			return fail(400, { message: 'Password must be at least 8 characters.' })
		}

		try {
			const user = await auth.createUser({
				key: { providerId: 'username', providerUserId: username, password },
				attributes: { name, username, about, email, isAdmin: false }
			})

			const session = await auth.createSession({ userId: user.userId, attributes: {} })
			await locals.auth.setSession(session)
			throw redirect(303, `/user/${user.userId}/recipes`)
		} catch (err) {
			console.error(err)
			if (err?.message === 'AUTH_DUPLICATE_KEY_ID') {
				return fail(400, { message: 'Username already taken!' })
			}
			if (err?.code === 'P2002') {
				const t = err.meta?.target || []
				if (t.includes('email')) return fail(400, { message: 'Email already taken!' })
				if (t.includes('username')) return fail(400, { message: 'Username already taken!' })
			}
			return fail(400, { message: 'Could not register user.' })
		}
	}
}
