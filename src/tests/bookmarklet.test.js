import { describe, it, expect } from 'vitest'
import {
	BOOKMARKLET_WINDOW_NAME_PREFIX,
	buildBookmarkletCode,
	readBookmarkletPayload
} from '$lib/utils/bookmarklet'

describe('bookmarklet helpers', () => {
	it('builds bookmarklet code that forwards to /recipe/new and captures text', () => {
		const code = buildBookmarkletCode('https://cookbook.example')

		expect(code).toContain("window.location.href=baseUrl+'/recipe/new?url='")
		expect(code).toContain("document.body&&document.body.innerText")
		expect(code).toContain('&bookmarklet=1')
	})

	it('reads payload from window.name', () => {
		const payload = {
			url: 'https://example.com/recipe',
			title: 'Example Recipe',
			text: 'Ingredients\n1 onion'
		}
		const fakeWindow = {
			name: `${BOOKMARKLET_WINDOW_NAME_PREFIX}${encodeURIComponent(JSON.stringify(payload))}`
		}

		expect(readBookmarkletPayload(fakeWindow)).toEqual(payload)
		expect(fakeWindow.name).toBe('')
	})
})
