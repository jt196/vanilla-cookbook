import { dev } from '$app/environment'
import { githubAuth } from '$lib/server/oauth.js'

export async function GET({ url, cookies }) {
	if (url.searchParams.get('provider') !== 'github') {
		return new Response('Invalid provider', { status: 400 })
	}
	const [authUrl, state] = await githubAuth.getAuthorizationUrl()

	cookies.set('oauth_provider', 'github', { httpOnly: true, secure: !dev, path: '/', maxAge: 600 })
	cookies.set('oauth_state', state, { httpOnly: true, secure: !dev, path: '/', maxAge: 600 })

	console.log('Authorize URL:', authUrl.toString())
	// You MUST see: client_id=Iv... and redirect_uri=http://localhost:5173/api/oauth/callback

	return new Response(null, { status: 302, headers: { Location: authUrl.toString() } })
}
