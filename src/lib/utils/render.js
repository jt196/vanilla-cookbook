import DOMPurify from 'dompurify'
import { marked } from 'marked'

export function getSanitizedHTML(content) {
	const dirtyHTML = marked(content)
	const sanitizedHTML = DOMPurify.sanitize(dirtyHTML)

	return sanitizedHTML
}

const renderer = new marked.Renderer()
renderer.paragraph = (text) => text // Don't wrap in <p> tags

marked.setOptions({ renderer })
