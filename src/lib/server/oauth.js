// $lib/server/oauth.js
import { github } from '@lucia-auth/oauth/providers'
import { google } from '@lucia-auth/oauth/providers'
import { auth } from './lucia.js'
import {
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	ORIGIN
} from '$env/static/private'

export const googleAuth = google(auth, {
	clientId: GOOGLE_CLIENT_ID || '',
	clientSecret: GOOGLE_CLIENT_SECRET || ''
})

console.log('GH id present?', !!GITHUB_CLIENT_ID, 'secret?', !!GITHUB_CLIENT_SECRET)

// export const githubAuth = github(lucia, {
// 	clientId: GITHUB_CLIENT_ID || '',
// 	clientSecret: GITHUB_CLIENT_SECRET || '',
// 	redirectUri: `${ORIGIN}/api/oauth/callback`,
// 	scope: ['user:email']
// })

const GH_ID = GITHUB_CLIENT_ID?.trim()
const GH_SECRET = GITHUB_CLIENT_SECRET?.trim()
const BASE = ORIGIN?.trim().replace(/\/$/, '')

if (!GH_ID || !GH_SECRET) throw new Error('Missing GitHub env')
if (!BASE) throw new Error('Missing ORIGIN')

export const githubAuth = github(auth, {
	clientId: GH_ID,
	clientSecret: GH_SECRET,
	scope: ['read:user', 'user:email'],
	redirectUri: `${BASE}/api/oauth/callback` // must EXACTLY match your GitHub OAuth App
})

export const getOAuthProviders = () => {
	const providers = {}

	// if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
	// 	providers.google = googleAuth
	// }

	if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
		providers.github = githubAuth
	}

	return providers
}

export const isOauthEnabled = () => {
	return Object.keys(getOAuthProviders()).length > 0
}
