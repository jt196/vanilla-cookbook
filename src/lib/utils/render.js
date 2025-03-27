import { marked } from 'marked'
import DOMPurify from 'dompurify'

/**
 * Takes Markdown content and returns sanitized HTML.
 *
 * Server-side rendering is done using `sanitize-html` while client-side rendering
 * is done using `DOMPurify`.
 *
 * @param {string} content - Markdown content to be sanitized and rendered as HTML.
 * @returns {Promise<string>} Sanitized HTML content.
 */
export async function getSanitizedHTML(content) {
	const dirtyHTML = marked(content)

	// For server-side
	if (import.meta.env.SSR) {
		const sanitizeHtml = (await import('sanitize-html')).default
		return sanitizeHtml(dirtyHTML)
	} else {
		// For client-side
		return DOMPurify.sanitize(dirtyHTML)
	}
}

const renderer = new marked.Renderer()
renderer.paragraph = (text) => text // Don't wrap in <p> tags

marked.setOptions({ renderer })
