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

// Don't wrap in <p> tags. Renderer methods receive tokens (marked >= 13), so render the
// paragraph's inline tokens directly; `this` is the renderer, hence a non-arrow function.
marked.use({
	renderer: {
		paragraph({ tokens }) {
			return this.parser.parseInline(tokens)
		}
	}
})
