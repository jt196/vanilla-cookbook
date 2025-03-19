import { generateSW } from 'workbox-build'

const workboxConfig = {
	globDirectory: 'build/client/',
	globPatterns: ['**/*.{css,js,svg,png,jpg}'],
	swDest: 'static/service-worker.js',
	skipWaiting: true,
	clientsClaim: true,
	mode: 'production', // Ensures minimal output
	// This forces CDN usage for Workbox libs
	useLocalWorkboxLibraries: false, // optional but explicit
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

generateSW(workboxConfig)
	.then(() => {
		console.log('Service worker generated successfully!')
	})
	.catch((error) => {
		console.error('Failed to generate service worker:', error)
	})
