import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function mockFetchForURL() {
	global.fetch = async (url) => {
		console.log(`Mock fetch called with URL: ${url}`) // Log the URL
		const filename = urlToFilename(url)
		// Adjust the path to point to the correct directory for your HTML files
		const filePath = resolve(__dirname, '../../../lib/data/recipe_html', filename)
		const htmlContent = fs.readFileSync(filePath, 'utf-8')
		return {
			ok: true,
			text: async () => htmlContent
		}
	}
}

export function urlToFilename(url) {
	// Convert the URL to a simplified string that can be used as a filename
	const simplifiedUrl = url
		.replace('https://', '')
		.replace('http://', '')
		.replace('www.', '')
		.replace(/\//g, '_')
		.replace(/-/g, '_')
		.replace(/\./g, '_')

	return `${simplifiedUrl}.html`
}
