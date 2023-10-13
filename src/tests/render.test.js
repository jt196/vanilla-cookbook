import '@testing-library/jest-dom'
import { getSanitizedHTML } from '$lib/utils/render.js'

/* global expect, it, describe */

describe('getSanitizedHTML function', () => {
	it('should parse markdown bold tags correctly', async () => {
		const result = await getSanitizedHTML('**bold**')
		expect(result).toBe('<strong>bold</strong>')
	})

	it('should parse markdown header tags correctly', async () => {
		const result = await getSanitizedHTML('# heading')
		expect(result).toBe('<h1>heading</h1>\n')
	})

	it('should sanitize HTML correctly', async () => {
		let result = await getSanitizedHTML('<script>alert("XSS")</script>')
		expect(result).toBe('') // The script tag should be removed

		result = await getSanitizedHTML('<a href="javascript:alert(\'XSS\')">Click me</a>')
		expect(result).toBe('<a>Click me</a>') // The href attribute should be removed

		result = await getSanitizedHTML('<div onmouseover="alert(\'XSS\')">Hover over me</div>')
		expect(result).toBe('<div>Hover over me</div>') // The onmouseover attribute should be removed
	})

	it('should not wrap content in <p> tags', async () => {
		const result = await getSanitizedHTML('This is a test')
		expect(result).toBe('This is a test') // No <p> tags should be added
	})
})
