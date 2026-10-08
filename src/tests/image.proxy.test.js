// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('$lib/server/prisma', () => ({
	prisma: { recipePhoto: { findUnique: vi.fn() } }
}))

vi.mock('$lib/server/authHelpers', () => ({
	requireAuth: vi.fn(),
	requireOwnership: vi.fn(),
	jsonSuccess: vi.fn(),
	jsonError: vi.fn()
}))

vi.mock('$lib/utils/image/imageBackend.js', () => ({
	deleteSinglePhotoFile: vi.fn(),
	resizeImageBuffer: vi.fn(async (buffer) => buffer)
}))

vi.mock('$lib/utils/import/importHelpers.js', () => ({
	validImageTypes: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']
}))

vi.mock('file-type', () => ({ fileTypeFromBuffer: vi.fn() }))

vi.mock('axios', () => ({ default: { get: vi.fn() } }))

// Never touch the real uploads directory
vi.mock('fs', () => {
	const fsMock = {
		existsSync: vi.fn(() => false),
		readFileSync: vi.fn(),
		promises: { mkdir: vi.fn(), writeFile: vi.fn() }
	}
	return { default: fsMock, ...fsMock }
})

import { prisma } from '$lib/server/prisma'
import { fileTypeFromBuffer } from 'file-type'
import axios from 'axios'
import fs from 'fs'
import { GET } from '../routes/api/recipe/image/[id]/+server.js'

const remotePhoto = {
	id: 'photo-1',
	fileType: 'jpg',
	url: 'https://media.example.com/cake.jpg'
}

describe('GET /api/recipe/image/[id] for remote-only photos', () => {
	beforeEach(() => {
		vi.spyOn(console, 'warn').mockImplementation(() => {})
		vi.spyOn(console, 'log').mockImplementation(() => {})
		vi.spyOn(console, 'error').mockImplementation(() => {})
		prisma.recipePhoto.findUnique.mockResolvedValue(remotePhoto)
	})

	afterEach(() => {
		vi.clearAllMocks()
		vi.restoreAllMocks()
	})

	it('serves the remote image and saves a local copy', async () => {
		axios.get.mockResolvedValue({ data: new Uint8Array([1, 2, 3]).buffer })
		fileTypeFromBuffer.mockResolvedValue({ ext: 'jpg', mime: 'image/jpeg' })

		const res = await GET({ params: { id: 'photo-1' } })

		expect(res.status).toBe(200)
		expect(res.headers.get('Content-Type')).toBe('image/jpeg')
		expect(axios.get).toHaveBeenCalledWith(
			remotePhoto.url,
			expect.objectContaining({ timeout: expect.any(Number) })
		)
		expect(fs.promises.writeFile).toHaveBeenCalledWith(
			expect.stringMatching(/uploads[\\/]images[\\/]photo-1\.jpg$/),
			expect.any(Buffer)
		)
	})

	it('returns 204 with a one-line warning when the remote site fails', async () => {
		axios.get.mockRejectedValue(
			Object.assign(new Error('Bad Gateway'), { response: { status: 502 } })
		)

		const res = await GET({ params: { id: 'photo-1' } })

		expect(res.status).toBe(204)
		expect(console.warn).toHaveBeenCalledWith(
			'Remote image unavailable for photo photo-1 (media.example.com): 502'
		)
		expect(console.error).not.toHaveBeenCalled()
		expect(fs.promises.writeFile).not.toHaveBeenCalled()
	})

	it('reports timeouts by error code', async () => {
		axios.get.mockRejectedValue(Object.assign(new Error('timeout'), { code: 'ECONNABORTED' }))

		await GET({ params: { id: 'photo-1' } })

		expect(console.warn).toHaveBeenCalledWith(
			'Remote image unavailable for photo photo-1 (media.example.com): ECONNABORTED'
		)
	})

	it('does not serve or save content that is not an image', async () => {
		axios.get.mockResolvedValue({ data: Buffer.from('<html>blocked</html>') })
		fileTypeFromBuffer.mockResolvedValue(undefined)

		const res = await GET({ params: { id: 'photo-1' } })

		expect(res.status).toBe(204)
		expect(fs.promises.writeFile).not.toHaveBeenCalled()
	})

	it('still serves the image if saving the local copy fails', async () => {
		axios.get.mockResolvedValue({ data: new Uint8Array([1, 2, 3]).buffer })
		fileTypeFromBuffer.mockResolvedValue({ ext: 'png', mime: 'image/png' })
		fs.promises.writeFile.mockRejectedValueOnce(new Error('EACCES'))

		const res = await GET({ params: { id: 'photo-1' } })

		expect(res.status).toBe(200)
		expect(res.headers.get('Content-Type')).toBe('image/png')
	})
})
