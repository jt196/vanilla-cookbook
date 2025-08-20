// $lib/server/oauth.js
import { github, google } from '@lucia-auth/oauth/providers'
import { auth } from './lucia.js'
import { env } from '$env/dynamic/private'

const BASE = env.ORIGIN?.trim()?.replace(/\/$/, '')

// GitHub
const GH_ID = env.GITHUB_CLIENT_ID?.trim()
const GH_SECRET = env.GITHUB_CLIENT_SECRET?.trim()

export const githubAuth =
	GH_ID && GH_SECRET && BASE
		? github(auth, {
				clientId: GH_ID,
				clientSecret: GH_SECRET,
				scope: ['read:user', 'user:email'],
				redirectUri: `${BASE}/api/oauth/callback`
			})
		: null

// Google (optional)
const GG_ID = env.GOOGLE_CLIENT_ID?.trim()
const GG_SECRET = env.GOOGLE_CLIENT_SECRET?.trim()

export const googleAuth =
	GG_ID && GG_SECRET && BASE
		? google(auth, {
				clientId: GG_ID,
				clientSecret: GG_SECRET,
				// add scopes/redirectUri if you’re using PKCE flow & callback
				redirectUri: `${BASE}/api/oauth/callback`
			})
		: null

export const getOAuthProviders = () => {
	const providers = {}
	if (githubAuth) providers.github = githubAuth
	if (googleAuth) providers.google = googleAuth
	return providers
}

export const isOauthEnabled = () => Object.keys(getOAuthProviders()).length > 0
