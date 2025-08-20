// $lib/server/oauth.js
import { github, google } from '@lucia-auth/oauth/providers'
import { auth } from './lucia.js'
import {
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	ORIGIN
} from '$env/static/private'

const BASE = ORIGIN?.trim().replace(/\/$/, '')

// ---- GitHub ----
export const githubAuth = github(auth, {
	clientId: GITHUB_CLIENT_ID.trim(),
	clientSecret: GITHUB_CLIENT_SECRET.trim(),
	scope: ['read:user', 'user:email'],
	redirectUri: `${BASE}/api/oauth/callback`
})

// ---- Google ----
// Recommended scopes: openid + email (+ profile if you want name/picture)
export const googleAuth = google(auth, {
	clientId: GOOGLE_CLIENT_ID.trim(),
	clientSecret: GOOGLE_CLIENT_SECRET.trim(),
	redirectUri: `${BASE}/api/oauth/callback`,
	scope: ['openid', 'email', 'profile']
})

// helpers for UI toggles
export const getOAuthProviders = () => {
	const providers = {}
	if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) providers.github = githubAuth
	if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) providers.google = googleAuth
	return providers
}

export const isOauthEnabled = () => Object.keys(getOAuthProviders()).length > 0
