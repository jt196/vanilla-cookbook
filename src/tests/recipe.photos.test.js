// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('$lib/server/prisma', () => ({
	prisma: {
		recipe: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
		recipePhoto: { create: vi.fn(), delete: vi.fn() }
	}
}))

vi.mock('$lib/server/authHelpers', () => ({
	requireAuth: vi.fn(() => ({ userId: 'me', isAdmin: false })),
	jsonSuccess: vi.fn((data) => ({ ok: true, data })),
	jsonError: vi.fn((status, body) => ({ ok: false, status, body }))
}))

// Never touch the real uploads directory
vi.mock('fs', () => {
	const fsMock = {
		existsSync: vi.fn(),
		promises: { copyFile: vi.fn() }
	}
	return { default: fsMock, ...fsMock }
})

import { prisma } from '$lib/server/prisma'
import fs from 'fs'
import { POST as duplicatePost } from '../routes/api/recipe/[uid]/duplicate/+server.js'

const sourceRecipe = (photos) => ({
	uid: 'src',
	userId: 'someone-else',
	is_public: true,
	name: 'Carrot Cake',
	photos
})

describe('duplicating a recipe copies its photos', () => {
	let nextId
	beforeEach(() => {
		nextId = 0
		vi.spyOn(console, 'warn').mockImplementation(() => {})
		prisma.recipe.findFirst.mockResolvedValue(null)
		prisma.recipe.create.mockResolvedValue({ uid: 'copy' })
		prisma.recipePhoto.create.mockImplementation(async ({ data }) => ({
			id: `new-${++nextId}`,
			...data
		}))
	})

	afterEach(() => {
		vi.clearAllMocks()
		vi.restoreAllMocks()
	})

	it('copies local files (uploaded and cached-remote) and keeps URL-only photos as links', async () => {
		prisma.recipe.findUnique.mockResolvedValue(
			sourceRecipe([
				{ id: 'cached', url: 'https://site/cake.jpg', fileType: 'jpg', isMain: true },
				{ id: 'uploaded', url: null, fileType: 'png', isMain: false },
				{ id: 'remote-only', url: 'https://site/slice.jpg', fileType: 'jpg', isMain: false }
			])
		)
		fs.existsSync.mockImplementation((p) => !p.includes('remote-only'))

		const res = await duplicatePost({ locals: {}, params: { uid: 'src' } })

		expect(res.ok).toBe(true)
		const created = prisma.recipePhoto.create.mock.calls.map(([{ data }]) => data)
		expect(created).toEqual([
			{ recipeUid: 'copy', url: 'https://site/cake.jpg', fileType: 'jpg', isMain: true },
			{ recipeUid: 'copy', url: null, fileType: 'png', isMain: false },
			{ recipeUid: 'copy', url: 'https://site/slice.jpg', fileType: 'jpg', isMain: false }
		])
		const copies = fs.promises.copyFile.mock.calls.map(([from, to]) => [
			from.split(/[\\/]/).pop(),
			to.split(/[\\/]/).pop()
		])
		expect(copies).toEqual([
			['cached.jpg', 'new-1.jpg'],
			['uploaded.png', 'new-2.png']
		])
	})

	it('skips photos with neither a local file nor a URL', async () => {
		prisma.recipe.findUnique.mockResolvedValue(
			sourceRecipe([{ id: 'gone', url: null, fileType: 'jpg', isMain: true }])
		)
		fs.existsSync.mockReturnValue(false)

		await duplicatePost({ locals: {}, params: { uid: 'src' } })

		expect(prisma.recipePhoto.create).not.toHaveBeenCalled()
	})

	it('drops an uploaded photo row if its file cannot be copied', async () => {
		prisma.recipe.findUnique.mockResolvedValue(
			sourceRecipe([{ id: 'uploaded', url: null, fileType: 'png', isMain: true }])
		)
		fs.existsSync.mockReturnValue(true)
		fs.promises.copyFile.mockRejectedValueOnce(new Error('ENOSPC'))

		await duplicatePost({ locals: {}, params: { uid: 'src' } })

		expect(prisma.recipePhoto.delete).toHaveBeenCalledWith({ where: { id: 'new-1' } })
	})
})
