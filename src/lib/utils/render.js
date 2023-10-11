import { marked } from 'marked'
import DOMPurify from 'dompurify'

export async function getSanitizedHTML(content) {
	const dirtyHTML = marked(content)

	if (import.meta.env.SSR) {
		const sanitizeHtml = (await import('sanitize-html')).default
		return sanitizeHtml(dirtyHTML)
	} else {
		return DOMPurify.sanitize(dirtyHTML)
	}
}

// export function getSanitizedHTML(content) {
// 	let sanitizedContent
// 	if (import.meta.env.SSR) {
// 		console.log('SSR sanitised HTML!')
// 		return content
// 	}
// 	console.log('Client Side rendered HTML!')
// 	const dirtyHTML = marked(content)
// 	sanitizedContent = DOMPurify.sanitize(dirtyHTML)

// 	return sanitizedContent
// }

const renderer = new marked.Renderer()
renderer.paragraph = (text) => text // Don't wrap in <p> tags

marked.setOptions({ renderer })
