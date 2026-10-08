// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('$lib/utils/import/importHelpers', () => ({
	saveFile: vi.fn(),
	validImageTypes: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']
}))

import { saveFile } from '$lib/utils/import/importHelpers'
import { processImage } from '$lib/utils/image/imageBackend.js'

describe('processImage remote downloads', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	it('fails (returns false) on a non-2xx response without saving anything', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(new Response('<html>Forbidden</html>', { status: 403 }))
		)

		const ok = await processImage('https://site.example/cake.jpg', 'photo-1', 'jpg')

		expect(ok).toBe(false)
		expect(saveFile).not.toHaveBeenCalled()
		expect(String(console.error.mock.calls[0][1]?.message)).toContain('HTTP 403')
	})

	it('passes a timeout signal to fetch', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 404 }))
		vi.stubGlobal('fetch', fetchMock)

		await processImage('https://site.example/cake.jpg', 'photo-1', 'jpg')

		expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
	})
})
