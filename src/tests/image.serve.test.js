// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import sharp from 'sharp'

vi.mock('$lib/server/prisma', () => ({
	prisma: { recipePhoto: { findUnique: vi.fn() } }
}))

import { prisma } from '$lib/server/prisma'
import { deleteSinglePhotoFile } from '$lib/utils/image/imageBackend.js'
import { GET } from '../routes/api/recipe/image/[id]/+server.js'

let root
const imagePath = (name) => path.join(root, 'uploads/images', name)
const thumbPath = (id) => path.join(root, 'uploads/thumbs', `${id}-400.webp`)

async function writeJpeg(id, width = 1200, height = 800) {
	await sharp({ create: { width, height, channels: 3, background: '#c33' } })
		.jpeg()
		.toFile(imagePath(`${id}.jpg`))
}

function serve(fileType, { w, etag, id = 'p1' } = {}) {
	prisma.recipePhoto.findUnique.mockResolvedValue({ id, fileType })
	const url = new URL(`http://localhost/api/recipe/image/${id}${w ? `?w=${w}` : ''}`)
	const headers = etag ? { 'if-none-match': etag } : {}
	return GET({ params: { id }, url, request: new Request(url, { headers }) })
}

beforeEach(() => {
	vi.clearAllMocks()
	root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-images-'))
	fs.mkdirSync(path.join(root, 'uploads/images'), { recursive: true })
	vi.spyOn(process, 'cwd').mockReturnValue(root)
	vi.spyOn(console, 'log').mockImplementation(() => {})
	vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
	vi.restoreAllMocks()
	fs.rmSync(root, { recursive: true, force: true })
})

describe('GET /api/recipe/image/[id]', () => {
	it.each([
		['jpg', 'image/jpeg'],
		['JPEG', 'image/jpeg'],
		['png', 'image/png'],
		['webp', 'image/webp']
	])('serves %s originals as %s with caching headers', async (fileType, contentType) => {
		fs.writeFileSync(imagePath(`p1.${fileType}`), 'img')
		const res = await serve(fileType)
		expect(res.headers.get('Content-Type')).toBe(contentType)
		expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
		expect(res.headers.get('Cache-Control')).toBe('private, max-age=2592000')
		expect(res.headers.get('ETag')).toMatch(/^".+"$/)
	})

	it.each(['svg', 'svg+xml', 'html', 'xml'])(
		'never serves %s with an inline-renderable type',
		async (fileType) => {
			fs.writeFileSync(imagePath(`p1.${fileType}`), '<svg/>')
			const res = await serve(fileType)
			expect(res.headers.get('Content-Type')).toBe('application/octet-stream')
		}
	)

	it('returns an uncacheable 204 when there is no file', async () => {
		const missingType = await serve(null)
		expect(missingType.status).toBe(204)
		const missingFile = await serve('jpg')
		expect(missingFile.status).toBe(204)
		expect(missingFile.headers.get('Cache-Control')).toBe('no-store')
	})

	it('answers a matching If-None-Match with 304 and no body', async () => {
		fs.writeFileSync(imagePath('p1.jpg'), 'img')
		const first = await serve('jpg')
		const second = await serve('jpg', { etag: first.headers.get('ETag') })
		expect(second.status).toBe(304)
		expect(await second.text()).toBe('')
	})

	describe('thumbnails', () => {
		it('generates a 400px WebP on first request and caches it on disk', async () => {
			await writeJpeg('p1')
			const res = await serve('jpg', { w: 400 })

			expect(res.headers.get('Content-Type')).toBe('image/webp')
			const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata()
			expect(meta).toMatchObject({ format: 'webp', width: 400, height: 267 })
			expect(fs.existsSync(thumbPath('p1'))).toBe(true)
		})

		it('serves the cached thumbnail without regenerating it', async () => {
			await writeJpeg('p1')
			await serve('jpg', { w: 400 })
			const cachedMtime = fs.statSync(thumbPath('p1')).mtimeMs

			await serve('jpg', { w: 400 })
			expect(fs.statSync(thumbPath('p1')).mtimeMs).toBe(cachedMtime)
		})

		it('never enlarges small originals', async () => {
			await writeJpeg('p1', 300, 200)
			const res = await serve('jpg', { w: 400 })
			const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata()
			expect(meta.width).toBe(300)
		})

		it('ignores unsupported widths and serves the original', async () => {
			await writeJpeg('p1')
			const res = await serve('jpg', { w: 37 })
			expect(res.headers.get('Content-Type')).toBe('image/jpeg')
			expect(fs.existsSync(path.join(root, 'uploads/thumbs'))).toBe(false)
		})

		it('falls back to the original when it cannot be decoded', async () => {
			fs.writeFileSync(imagePath('p1.jpg'), 'not really a jpeg')
			const res = await serve('jpg', { w: 400 })
			expect(res.status).toBe(200)
			expect(res.headers.get('Content-Type')).toBe('image/jpeg')
		})

		it('are removed when the photo file is deleted', async () => {
			await writeJpeg('p1')
			await serve('jpg', { w: 400 })
			await deleteSinglePhotoFile('p1', 'jpg')
			expect(fs.existsSync(thumbPath('p1'))).toBe(false)
		})
	})
})
