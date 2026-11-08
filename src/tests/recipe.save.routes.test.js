// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/server/prisma', () => ({
	prisma: {
		recipe: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
		recipePhoto: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
		recipeCategory: { deleteMany: vi.fn(), create: vi.fn() }
	}
}))
vi.mock('$lib/utils/import/importHelpers', () => ({
	saveFile: vi.fn(),
	validImageTypes: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']
}))
vi.mock('$lib/utils/image/imageBackend', () => ({
	saveRemoteImageAsPhoto: vi.fn(),
	deleteSinglePhotoFile: vi.fn()
}))
vi.mock('$lib/server/semanticEmbedding', () => ({
	regenerateRecipeEmbedding: vi.fn(() => Promise.resolve())
}))

import { prisma } from '$lib/server/prisma'
import { saveFile } from '$lib/utils/import/importHelpers'
import * as imageBackend from '$lib/utils/image/imageBackend'
import { regenerateRecipeEmbedding } from '$lib/server/semanticEmbedding'
import { POST as createPost } from '../routes/api/recipe/+server.js'
import { PUT as updatePut } from '../routes/api/recipe/[uid]/+server.js'

import { fake } from './helpers/fake.js'

const PNG = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 1,
	0, 0, 0, 1, 8, 6, 0, 0, 0
])
const pngFile = () => new File([PNG], 'photo.png', { type: 'image/png' })
const textFile = () => new File(['not an image'], 'evil.png', { type: 'image/png' })

const user = { userId: 'u1' }
const locals = (extra = {}) => ({ user, site: { semantic: { enabled: false } }, ...extra })

function formRequest(recipe, images = []) {
	const form = new FormData()
	form.append('recipe', typeof recipe === 'string' ? recipe : JSON.stringify(recipe))
	for (const image of images) form.append('images', image)
	return new Request('http://localhost/api/recipe', { method: 'POST', body: form })
}

let photoSeq = 0
beforeEach(() => {
	vi.clearAllMocks()
	vi.spyOn(console, 'log').mockImplementation(() => {})
	vi.spyOn(console, 'warn').mockImplementation(() => {})
	vi.spyOn(console, 'error').mockImplementation(() => {})
	photoSeq = 0
	vi.mocked(prisma.recipePhoto.create).mockImplementation(
		fake(async ({ data }) => ({
			id: `p${++photoSeq}`,
			...data
		}))
	)
	vi.mocked(prisma.recipePhoto.delete).mockResolvedValue(fake({}))
	vi.mocked(prisma.recipePhoto.findFirst).mockResolvedValue(null)
	vi.mocked(prisma.recipe.create).mockImplementation(
		fake(async ({ data }) => ({ uid: 'r1', ...data }))
	)
	vi.mocked(prisma.recipe.findUnique).mockResolvedValue(fake({ uid: 'r1', userId: 'u1' }))
	vi.mocked(prisma.recipe.update).mockResolvedValue(fake({}))
})

/** Photo rows that were created and not deleted afterwards. */
function remainingPhotoIds() {
	const created = vi.mocked(prisma.recipePhoto.create).mock.results.map((r) => r.value)
	const deleted = new Set(vi.mocked(prisma.recipePhoto.delete).mock.calls.map((c) => c[0].where.id))
	return Promise.all(created).then((rows) => rows.map((r) => r.id).filter((id) => !deleted.has(id)))
}

describe('POST /api/recipe', () => {
	it('creates the recipe for the current user, stringifying times', async () => {
		const res = await createPost(
			fake({
				request: formRequest({ name: 'Soup', cook_time: 15, servings: 4, saveImageUrl: false }),
				locals: locals()
			})
		)
		expect(await res.json()).toEqual({ uid: 'r1' })
		expect(vi.mocked(prisma.recipe.create).mock.calls[0][0].data).toMatchObject({
			name: 'Soup',
			cook_time: '15',
			servings: '4',
			userId: 'u1'
		})
	})

	it('rejects an invalid recipe payload', async () => {
		const res = await createPost(fake({ request: formRequest('{oops'), locals: locals() }))
		expect(res.status).toBe(400)
		expect(prisma.recipe.create).not.toHaveBeenCalled()
	})

	it('saves valid uploads and leaves no photo row for invalid ones', async () => {
		await createPost(
			fake({
				request: formRequest({ name: 'Soup', saveImageUrl: false }, [textFile(), pngFile()]),
				locals: locals()
			})
		)
		expect(saveFile).toHaveBeenCalledTimes(1)
		const savedName = vi.mocked(saveFile).mock.calls[0][1]
		expect(await remainingPhotoIds()).toEqual([savedName.replace('.png', '')])
	})

	it('downloads the image URL as the main photo unless told not to', async () => {
		await createPost(
			fake({
				request: formRequest({ name: 'Soup', image_url: 'https://img.example/a.jpg' }),
				locals: locals()
			})
		)
		expect(imageBackend.saveRemoteImageAsPhoto).toHaveBeenCalledWith(
			expect.objectContaining({ recipeUid: 'r1', url: 'https://img.example/a.jpg', isMain: true })
		)

		vi.clearAllMocks()
		await createPost(
			fake({
				request: formRequest({
					name: 'Soup',
					image_url: 'https://img.example/a.jpg',
					saveImageUrl: false
				}),
				locals: locals()
			})
		)
		expect(imageBackend.saveRemoteImageAsPhoto).not.toHaveBeenCalled()
	})

	it('queues an embedding update when semantic search is on', async () => {
		await createPost(
			fake({
				request: formRequest({ name: 'Soup', saveImageUrl: false }),
				locals: locals({ site: { semantic: { enabled: true, provider: 'openai', model: 'm' } } })
			})
		)
		expect(regenerateRecipeEmbedding).toHaveBeenCalledWith('r1', 'openai', 'm')
	})
})

describe('PUT /api/recipe/[uid]', () => {
	const put = (recipe, images, extraLocals) =>
		updatePut(
			fake({
				request: formRequest(recipe, images),
				locals: locals(extraLocals),
				params: { uid: 'r1' }
			})
		)

	it("refuses to update another user's recipe", async () => {
		vi.mocked(prisma.recipe.findUnique).mockResolvedValue(
			fake({ uid: 'r1', userId: 'someone-else' })
		)
		await expect(put({ name: 'Mine now' })).rejects.toMatchObject({ status: 403 })
		expect(prisma.recipe.update).not.toHaveBeenCalled()
	})

	it('updates only allowed fields and stringifies times', async () => {
		const res = await put({ name: 'Soup', prep_time: 5, userId: 'attacker', uid: 'other' })
		expect(res.status).toBe(200)
		const { data } = vi.mocked(prisma.recipe.update).mock.calls[0][0]
		expect(data).toMatchObject({ name: 'Soup', prep_time: '5' })
		expect(data).not.toHaveProperty('userId')
		expect(data).not.toHaveProperty('uid')
	})

	it('leaves existing category links alone', async () => {
		await put({ name: 'Soup', categories: ['c1'] })
		expect(prisma.recipeCategory.deleteMany).not.toHaveBeenCalled()
		expect(prisma.recipeCategory.create).not.toHaveBeenCalled()
	})

	it('saves valid uploads and leaves no photo row for invalid ones', async () => {
		await put({ name: 'Soup' }, [pngFile(), textFile()])
		expect(saveFile).toHaveBeenCalledTimes(1)
		const savedName = vi.mocked(saveFile).mock.calls[0][1]
		expect(await remainingPhotoIds()).toEqual([savedName.replace('.png', '')])
	})

	it('downloads the image URL only when asked and not already saved', async () => {
		const { saveRemoteImageAsPhoto } = imageBackend
		await put({ name: 'Soup', image_url: 'https://img.example/a.jpg' })
		expect(saveRemoteImageAsPhoto).not.toHaveBeenCalled()

		await put({ name: 'Soup', image_url: 'https://img.example/a.jpg', saveImageUrl: true })
		expect(saveRemoteImageAsPhoto).toHaveBeenCalledTimes(1)
		expect(vi.mocked(saveRemoteImageAsPhoto).mock.calls[0][0]).toMatchObject({
			recipeUid: 'r1',
			isMain: true
		})

		vi.clearAllMocks()
		vi.mocked(prisma.recipePhoto.findFirst).mockResolvedValueOnce(fake({ id: 'existing' }))
		await put({ name: 'Soup', image_url: 'https://img.example/a.jpg', saveImageUrl: true })
		expect(saveRemoteImageAsPhoto).not.toHaveBeenCalled()
	})

	it('queues an embedding update when semantic search is on', async () => {
		await put({ name: 'Soup' }, [], {
			site: { semantic: { enabled: true, provider: 'openai', model: 'm' } }
		})
		expect(regenerateRecipeEmbedding).toHaveBeenCalledWith('r1', 'openai', 'm')
	})
})
