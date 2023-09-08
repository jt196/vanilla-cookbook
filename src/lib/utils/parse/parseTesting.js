import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Mocks the global fetch function to read from local HTML files instead of making actual HTTP requests.
 * This is useful for testing purposes to avoid making real network requests.
 */
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

/**
 * Converts a given URL to a simplified filename string.
 * This is useful for saving web pages locally with a filename derived from their URL.
 *
 * @param {string} url - The URL to convert.
 * @returns {string} The simplified filename string.
 */
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
