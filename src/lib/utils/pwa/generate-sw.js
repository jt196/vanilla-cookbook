import { generateSW } from 'workbox-build'

const workboxConfig = {
	globDirectory: 'build/client/',
	// Exclude HTML files if they aren’t actually served as static files:
	globPatterns: ['**/*.{css,js,svg,png,jpg}'],
	swDest: 'static/service-worker.js',
	skipWaiting: true,
	clientsClaim: true,
	runtimeCaching: [
		// This rule matches the root URL ("/") optionally followed by query parameters.
		{
			urlPattern: /^\/(\?.*)?$/,
			handler: 'NetworkOnly'
		},
		{
			urlPattern: /\/login/,
			handler: 'NetworkOnly'
		},
		// Your existing runtime caching rule (if needed for other assets/routes)
		{
			urlPattern: new RegExp(`^%%URLPATTERN%%/`),
			handler: 'NetworkFirst',
			options: {
				cacheName: 'my-cache',
				expiration: {
					maxEntries: 10,
					maxAgeSeconds: 300
				}
			}
		}
	]
}

generateSW(workboxConfig)
	.then(() => {
		console.log('Service worker generated successfully!')
	})
	.catch((error) => {
		console.error('Failed to generate service worker:', error)
	})
