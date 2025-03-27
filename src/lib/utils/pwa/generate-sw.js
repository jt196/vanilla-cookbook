import { generateSW } from 'workbox-build'

/**
 * Configuration object for Workbox to generate a service worker.
 *
 * @type {import('workbox-build').GenerateSWOptions}
 */
const workboxConfig = {
	globDirectory: 'build/client/',
	globPatterns: ['**/*.{css,js,svg,png,jpg,webp}'],
	swDest: 'static/service-worker.js',
	skipWaiting: true,
	clientsClaim: true,
	mode: 'production', // Ensures minimal output
	runtimeCaching: [
		{
			urlPattern: /^\/(\?.*)?$/,
			handler: 'NetworkOnly'
		},
		{
			urlPattern: /\/login/,
			handler: 'NetworkOnly'
		},
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

/**
 * Generates a service worker using the given Workbox configuration.
 * Logs success or error information to the console.
 */
generateSW(workboxConfig)
	.then(() => {
		console.log('Service worker generated successfully!')
	})
	.catch((error) => {
		console.error('Failed to generate service worker:', error)
	})
