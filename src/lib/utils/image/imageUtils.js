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
