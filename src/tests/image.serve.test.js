import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/server/prisma', () => ({
	prisma: { recipePhoto: { findUnique: vi.fn() } }
}))

vi.mock('fs', () => ({
	default: { existsSync: vi.fn(() => true), readFileSync: vi.fn(() => Buffer.from('img')) }
}))

import { prisma } from '$lib/server/prisma'
import { GET } from '../routes/api/recipe/image/[id]/+server.js'

const serve = async (fileType) => {
	prisma.recipePhoto.findUnique.mockResolvedValue({ id: 'p1', fileType })
	return GET({ params: { id: 'p1' } })
}

describe('GET /api/recipe/image/[id]', () => {
	beforeEach(() => vi.clearAllMocks())

	it.each([
		['jpg', 'image/jpeg'],
		['JPEG', 'image/jpeg'],
		['png', 'image/png'],
		['webp', 'image/webp']
	])('serves %s as %s', async (fileType, contentType) => {
		const res = await serve(fileType)
		expect(res.headers.get('Content-Type')).toBe(contentType)
		expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
	})

	it.each(['svg', 'svg+xml', 'html', 'xml'])(
		'never serves %s with an inline-renderable type',
		async (fileType) => {
			const res = await serve(fileType)
			expect(res.headers.get('Content-Type')).toBe('application/octet-stream')
		}
	)

	it('returns 204 for a photo with no stored file type', async () => {
		const res = await serve(null)
		expect(res.status).toBe(204)
	})
})
