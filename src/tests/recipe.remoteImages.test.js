// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import sharp from 'sharp'

vi.mock('$lib/server/prisma', () => ({
	prisma: {
		recipePhoto: { create: vi.fn(), delete: vi.fn(), update: vi.fn(), findMany: vi.fn() }
	}
}))

vi.mock('$lib/utils/import/importHelpers', () => ({
	saveFile: vi.fn(),
	validImageTypes: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']
}))

// Never touch the real uploads directory
vi.mock('fs', () => {
	const promises = { mkdir: vi.fn(), writeFile: vi.fn(), rename: vi.fn() }
	const fsMock = { existsSync: vi.fn(), promises }
	return { default: fsMock, ...fsMock }
})

vi.mock('$lib/server/authHelpers', () => ({
	requireAuth: vi.fn(() => ({ userId: 'me' })),
	jsonSuccess: vi.fn((data) => data)
}))

import { prisma } from '$lib/server/prisma'
import fs from 'fs'
import {
	downloadRemoteImage,
	saveRemoteImageAsPhoto,
	findLinkOnlyPhotos,
	downloadLinkOnlyPhotos
} from '$lib/utils/image/imageBackend.js'
import { POST as downloadMissingPost } from '../routes/api/user/[id]/photos/download-missing/+server.js'

let png
beforeAll(async () => {
	png = await sharp({
		create: { width: 4, height: 4, channels: 3, background: '#f80' }
	})
		.png()
		.toBuffer()
})

const respond = (body, status = 200) => new Response(body, { status })

describe('remote recipe images', () => {
	beforeEach(() => {
		vi.spyOn(console, 'warn').mockImplementation(() => {})
		prisma.recipePhoto.create.mockImplementation(async ({ data }) => ({ id: 'photo-1', ...data }))
	})

	afterEach(() => {
		vi.clearAllMocks()
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	describe('downloadRemoteImage', () => {
		it('returns the image and its detected type', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(png)))
			const image = await downloadRemoteImage('https://site.example/cake')
			expect(image.ext).toBe('png')
			expect(Buffer.isBuffer(image.buffer)).toBe(true)
		})

		it('returns null with a one-line warning on HTTP errors', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond('Forbidden', 403)))
			expect(await downloadRemoteImage('https://site.example/cake.jpg')).toBeNull()
			expect(console.warn).toHaveBeenCalledWith(
				'Could not download image from site.example: Image download failed: HTTP 403'
			)
		})

		it('returns null for content that is not an image', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond('<html>nope</html>')))
			expect(await downloadRemoteImage('https://site.example/page')).toBeNull()
		})
	})

	describe('saveRemoteImageAsPhoto', () => {
		it('creates the photo row (with the URL and real type) and writes the file', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(png)))

			const photo = await saveRemoteImageAsPhoto({
				recipeUid: 'r1',
				url: 'https://site.example/cake.jpg',
				isMain: true
			})

			expect(prisma.recipePhoto.create).toHaveBeenCalledWith({
				data: {
					recipeUid: 'r1',
					url: 'https://site.example/cake.jpg',
					fileType: 'png',
					isMain: true
				}
			})
			expect(fs.promises.writeFile).toHaveBeenCalledWith(
				expect.stringMatching(/uploads[\\/]images[\\/]photo-1\.png$/),
				expect.any(Buffer)
			)
			expect(photo.id).toBe('photo-1')
		})

		it('creates nothing when the download fails', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond('Not found', 404)))

			expect(await saveRemoteImageAsPhoto({ recipeUid: 'r1', url: 'https://x/y.jpg' })).toBeNull()
			expect(prisma.recipePhoto.create).not.toHaveBeenCalled()
		})

		it('removes the row again if the file cannot be written', async () => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(png)))
			fs.promises.writeFile.mockRejectedValueOnce(new Error('EACCES'))

			expect(await saveRemoteImageAsPhoto({ recipeUid: 'r1', url: 'https://x/y.png' })).toBeNull()
			expect(prisma.recipePhoto.delete).toHaveBeenCalledWith({ where: { id: 'photo-1' } })
		})
	})

	describe('link-only photos', () => {
		const rows = [
			{ id: 'stored', url: 'https://a/1.jpg', fileType: 'jpg', recipe: { name: 'Stored' } },
			{ id: 'linked', url: 'https://b/2.jpg', fileType: 'jpg', recipe: { name: 'Carrot Cake' } },
			{ id: 'broken', url: 'https://c/3.jpg', fileType: 'jpg', recipe: { name: 'Oatcakes' } }
		]

		beforeEach(() => {
			prisma.recipePhoto.findMany.mockResolvedValue(rows)
			fs.existsSync.mockImplementation((p) => p.includes('stored'))
		})

		it("finds only the user's photos with a URL and no local file", async () => {
			const found = await findLinkOnlyPhotos('me')
			expect(prisma.recipePhoto.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { url: { not: null }, recipe: { userId: 'me' } } })
			)
			expect(found.map((p) => p.id)).toEqual(['linked', 'broken'])
		})

		it('downloads them in place, corrects the file type, and reports failures by recipe', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn((url) => Promise.resolve(url.includes('c/3') ? respond('gone', 404) : respond(png)))
			)

			const result = await downloadLinkOnlyPhotos('me')

			expect(result).toEqual({ downloaded: 1, failed: ['Oatcakes'] })
			expect(fs.promises.writeFile).toHaveBeenCalledWith(
				expect.stringMatching(/linked\.png$/),
				expect.any(Buffer)
			)
			expect(prisma.recipePhoto.update).toHaveBeenCalledWith({
				where: { id: 'linked' },
				data: { fileType: 'png' }
			})
		})

		it('the endpoint only works on your own account', async () => {
			await expect(
				downloadMissingPost({ locals: {}, params: { id: 'someone-else' } })
			).rejects.toMatchObject({ status: 403 })
		})
	})
})
