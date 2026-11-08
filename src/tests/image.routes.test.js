import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('$lib/server/prisma', () => ({
	prisma: {
		recipe: { findUnique: vi.fn() },
		recipePhoto: { findFirst: vi.fn() }
	}
}))

vi.mock('$lib/server/aiHelpers', () => ({
	resolveAIConfig: vi.fn(),
	generateImageBuffer: vi.fn()
}))

vi.mock('$lib/server/authHelpers', () => ({
	requireAuth: vi.fn(),
	requireOwnership: vi.fn()
}))

vi.mock('$lib/utils/api', () => ({
	createRecipePhotoEntry: vi.fn(),
	removeRecipePhotoEntry: vi.fn()
}))

vi.mock('$lib/utils/import/importHelpers', () => ({
	saveFile: vi.fn()
}))

vi.mock('file-type', () => ({
	fileTypeFromBuffer: vi.fn()
}))

import { prisma } from '$lib/server/prisma'
import { resolveAIConfig, generateImageBuffer } from '$lib/server/aiHelpers'
import { requireAuth, requireOwnership } from '$lib/server/authHelpers'
import { createRecipePhotoEntry } from '$lib/utils/api'
import { saveFile } from '$lib/utils/import/importHelpers'
import { fileTypeFromBuffer } from 'file-type'

import { POST as generateImagePost } from '../routes/api/recipe/[uid]/image/generate/+server.js'

import { fake } from './helpers/fake.js'

const mockUser = { userId: 'user1', username: 'testuser' }

const mockRecipe = {
	uid: 'recipe-123',
	userId: 'user1',
	name: 'Salmon Cakes',
	description: 'Delicious salmon cakes',
	ingredients: '1 pound fresh wild salmon\n1/4 cup bread crumbs',
	directions: 'Flake salmon. Mix. Form cakes. Pan-fry.'
}

const mockPhotoEntry = {
	id: 'photo-456',
	recipeUid: 'recipe-123',
	fileType: 'png',
	isMain: true,
	url: '/uploads/images/photo-456.png'
}

const mockAIConfig = { ok: true, provider: 'openai', model: 'dall-e-3' }

const mockAIDisabled = {
	ok: false,
	response: new Response(JSON.stringify({ error: 'AI image generation not configured.' }), {
		status: 503
	})
}

function createRequest(body = {}) {
	return { json: vi.fn().mockResolvedValue(body) }
}

describe('API Routes - /api/recipe/[uid]/image/generate', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(requireAuth).mockReturnValue(fake(mockUser))
		vi.mocked(requireOwnership).mockReturnValue(undefined)
		vi.mocked(prisma.recipe.findUnique).mockResolvedValue(fake(mockRecipe))
		vi.mocked(prisma.recipePhoto.findFirst).mockResolvedValue(null)
		vi.mocked(resolveAIConfig).mockReturnValue(fake(mockAIConfig))
		vi.mocked(generateImageBuffer).mockResolvedValue(Buffer.from('fake-image-data'))
		vi.mocked(fileTypeFromBuffer).mockResolvedValue({ ext: 'png', mime: 'image/png' })
		vi.mocked(createRecipePhotoEntry).mockResolvedValue(mockPhotoEntry)
		vi.mocked(saveFile).mockResolvedValue(undefined)
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('generates and saves a recipe image', async () => {
		const response = await generateImagePost(
			fake({
				request: createRequest(),
				locals: {},
				params: { uid: 'recipe-123' }
			})
		)
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.success).toBe(true)
		expect(data.photo.id).toBe('photo-456')
		expect(data.photo.recipeUid).toBe('recipe-123')
		expect(generateImageBuffer).toHaveBeenCalledWith(
			expect.objectContaining({ ok: true }),
			expect.stringContaining('Salmon Cakes')
		)
		expect(saveFile).toHaveBeenCalled()
	})

	it('includes recipe content in the image prompt', async () => {
		await generateImagePost(
			fake({
				request: createRequest(),
				locals: {},
				params: { uid: 'recipe-123' }
			})
		)

		const [, prompt] = vi.mocked(generateImageBuffer).mock.calls[0]
		expect(prompt).toContain('Salmon Cakes')
		expect(prompt).toContain('salmon')
	})

	it('uses a custom style description when provided', async () => {
		await generateImagePost(
			fake({
				request: createRequest({ styleDescription: 'Dark moody overhead lighting' }),
				locals: {},
				params: { uid: 'recipe-123' }
			})
		)

		const [, prompt] = vi.mocked(generateImageBuffer).mock.calls[0]
		expect(prompt).toContain('Dark moody overhead lighting')
	})

	it('falls back to default style when none provided', async () => {
		await generateImagePost(
			fake({
				request: createRequest(),
				locals: {},
				params: { uid: 'recipe-123' }
			})
		)

		const [, prompt] = vi.mocked(generateImageBuffer).mock.calls[0]
		expect(prompt).toContain('Photo realistic')
	})

	it('marks the photo as main when no existing main photo', async () => {
		vi.mocked(prisma.recipePhoto.findFirst).mockResolvedValue(null)

		await generateImagePost(
			fake({
				request: createRequest(),
				locals: {},
				params: { uid: 'recipe-123' }
			})
		)

		expect(createRecipePhotoEntry).toHaveBeenCalledWith(
			'recipe-123',
			null,
			'png',
			true // isMain = true when no existing main photo
		)
	})

	it('does not mark as main when a main photo already exists', async () => {
		vi.mocked(prisma.recipePhoto.findFirst).mockResolvedValue(fake({ id: 'existing-main' }))

		await generateImagePost(
			fake({
				request: createRequest(),
				locals: {},
				params: { uid: 'recipe-123' }
			})
		)

		expect(createRecipePhotoEntry).toHaveBeenCalledWith('recipe-123', null, 'png', false)
	})

	it('returns 400 when recipe has no name, ingredients, or directions', async () => {
		vi.mocked(prisma.recipe.findUnique).mockResolvedValue(
			fake({
				...mockRecipe,
				name: '',
				ingredients: '',
				directions: ''
			})
		)

		const response = await generateImagePost(
			fake({
				request: createRequest(),
				locals: {},
				params: { uid: 'recipe-123' }
			})
		)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.code).toBe('recipeForm.generateImageNeedContent')
		expect(generateImageBuffer).not.toHaveBeenCalled()
	})

	it('returns 503 when AI image generation is not configured', async () => {
		vi.mocked(resolveAIConfig).mockReturnValue(fake(mockAIDisabled))

		const response = await generateImagePost(
			fake({
				request: createRequest(),
				locals: {},
				params: { uid: 'recipe-123' }
			})
		)

		expect(response.status).toBe(503)
		expect(generateImageBuffer).not.toHaveBeenCalled()
	})

	it('returns 429 on rate limit error', async () => {
		vi.mocked(generateImageBuffer).mockRejectedValue(new Error('429 Too Many Requests'))
		vi.spyOn(console, 'error').mockImplementation(() => {})

		const response = await generateImagePost(
			fake({
				request: createRequest(),
				locals: {},
				params: { uid: 'recipe-123' }
			})
		)
		const data = await response.json()

		expect(response.status).toBe(429)
		expect(data.code).toBe('recipeForm.msg.rateLimit')
	})

	it('returns 500 on unexpected generation error', async () => {
		vi.mocked(generateImageBuffer).mockRejectedValue(new Error('Provider unavailable'))
		vi.spyOn(console, 'error').mockImplementation(() => {})

		const response = await generateImagePost(
			fake({
				request: createRequest(),
				locals: {},
				params: { uid: 'recipe-123' }
			})
		)
		const data = await response.json()

		expect(response.status).toBe(500)
		expect(data.error).toBe('Provider unavailable')
	})
})
