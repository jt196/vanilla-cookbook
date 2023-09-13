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

export function mapContentTypeToFileTypeAndExtension(contentType) {
	switch (contentType) {
		case 'image/jpeg':
			return { fileType: 'image/jpeg', extension: '.jpg' }
		case 'image/png':
			return { fileType: 'image/png', extension: '.png' }
		case 'image/gif':
			return { fileType: 'image/gif', extension: '.gif' }
		case 'image/webp':
			return { fileType: 'image/webp', extension: '.webp' }
		default:
			return { fileType: 'image/jpeg', extension: '.jpg' } // default values
	}
}

export async function checkImageExistence(url) {
	console.log(
		'🚀 ~ file: imageUtils.js:31 ~ checkImageExistence ~ encodeURIComponent(url):',
		encodeURIComponent(url)
	)
	try {
		const response = await fetch(`/api/recipe/images/remote-exist?url=${encodeURIComponent(url)}`)
		return response.ok
	} catch (error) {
		return false
	}
}
