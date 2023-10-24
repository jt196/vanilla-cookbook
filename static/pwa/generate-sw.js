import dotenv from 'dotenv'
import { generateSW } from 'workbox-build'

dotenv.config()

const domain = process.env.ORIGIN

const workboxConfig = {
	globDirectory: 'build/',
	globPatterns: ['**/*.{html,js,css,svg,png,jpg}'],
	swDest: 'static/pwa/service-worker.js',
	skipWaiting: true,
	clientsClaim: true,
	runtimeCaching: [
		{
			urlPattern: new RegExp(`^https://${domain}/`),
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
