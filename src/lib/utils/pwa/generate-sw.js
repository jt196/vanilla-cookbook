import { generateSW } from 'workbox-build'

const workboxConfig = {
	globDirectory: 'build/client/',
	globPatterns: ['**/*.{html,css,js,svg,png,jpg}'],
	swDest: 'static/service-worker.js',
	skipWaiting: true,
	clientsClaim: true,
	runtimeCaching: [
		{
			// Define a network-first strategy specifically for the home page ('/' path)
			urlPattern: new RegExp('^/$'),
			handler: 'NetworkFirst',
			options: {
				cacheName: 'home-page-cache',
				networkTimeoutSeconds: 3
			}
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

generateSW(workboxConfig)
	.then(() => {
		console.log('Service worker generated successfully!')
	})
	.catch((error) => {
		console.error('Failed to generate service worker:', error)
	})
