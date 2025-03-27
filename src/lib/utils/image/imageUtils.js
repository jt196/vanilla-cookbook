/**
 * Fetches the Content-Type of a given URL by making a HEAD request.
 *
 * @param {string} url - The URL to fetch the Content-Type for.
 * @returns {Promise<string|null>} A promise that resolves to the Content-Type of the URL, or null if the request fails.
 */
export async function getContentTypeFromUrl(url) {
	try {
		const response = await fetch(url, { method: 'HEAD' })
		if (!response.ok) {
			throw new Error('Failed to fetch the URL')
		}
		return response.headers.get('Content-Type')
	} catch (error) {
		console.error(`Error fetching Content-Type for URL ${url}:`, error)
		return null
	}
}

/**
 * Maps a given Content-Type to its corresponding file type and extension.
 *
 * @param {string} contentType - The Content-Type to map.
 * @returns {Object} An object containing the fileType and extension.
 *                   Defaults to 'image/jpeg' and 'jpg' if the Content-Type is unrecognized.
 */
export function mapContentTypeToFileTypeAndExtension(contentType) {
	switch (contentType) {
		case 'image/jpeg':
			return { fileType: 'image/jpeg', extension: 'jpg' }
		case 'image/png':
			return { fileType: 'image/png', extension: 'png' }
		case 'image/gif':
			return { fileType: 'image/gif', extension: 'gif' }
		case 'image/webp':
			return { fileType: 'image/webp', extension: 'webp' }
		default:
			return { fileType: 'image/jpeg', extension: 'jpg' } // default values
	}
}

/**
 * Checks if the given image URL exists remotely.
 *
 * @param {string} imageUrl - The URL of the image to check.
 * @param {string} baseUrl - The base URL of the API to make the request to.
 *
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the image exists or not.
 */
export async function checkImageExistence(imageUrl, baseUrl) {
	console.log('Checking image existence!')
	try {
		const response = await fetch(
			`${baseUrl}/api/recipe/image/remote-exist?url=${encodeURIComponent(imageUrl)}`
		)
		return response.ok
	} catch (error) {
		console.log('error:', error)
		return false
	}
}
