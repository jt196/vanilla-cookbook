import { generateSW } from 'workbox-build'

const workboxConfig = {
	globDirectory: 'build/',
	globPatterns: ['**/*.{html,js,css,svg,png,jpg}'],
	swDest: 'static/service-worker.js',
	skipWaiting: true,
	clientsClaim: true,
	runtimeCaching: [
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
