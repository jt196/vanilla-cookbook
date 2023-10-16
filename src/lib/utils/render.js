import { marked } from 'marked'
import DOMPurify from 'dompurify'

// I need to run different functions based on whether it's SSR or Client rendered
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
