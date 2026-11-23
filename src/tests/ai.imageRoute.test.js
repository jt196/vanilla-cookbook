// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock-driven, like ai.routes.test.js: no provider calls and no real image processing.
vi.mock('$lib/utils/ai', () => ({ extractRecipeWithLLM: vi.fn() }))
vi.mock('$lib/server/aiHelpers', () => ({ resolveAIConfig: vi.fn() }))
vi.mock('$lib/server/authHelpers', () => ({ requireAuth: vi.fn() }))
vi.mock('$lib/utils/image/imageBackend', () => ({
	resizeImageBuffer: vi.fn(async (buffer) => buffer),
	stitchImages: vi.fn(async () => Buffer.from('stitched'))
}))
vi.mock('file-type', () => ({ fileTypeFromBuffer: vi.fn() }))

import { extractRecipeWithLLM } from '$lib/utils/ai'
import { resolveAIConfig } from '$lib/server/aiHelpers'
import { requireAuth } from '$lib/server/authHelpers'
import { stitchImages } from '$lib/utils/image/imageBackend'
import { fileTypeFromBuffer } from 'file-type'
import { POST } from '../routes/api/recipe/parse/image/+server.js'
import { fake } from './helpers/fake.js'

const recipe = { name: 'Soup', ingredients: ['1 onion'], directions: 'Cook.' }

/** @param {number} count */
function imageRequest(count, language = 'deu') {
	const form = new FormData()
	for (let i = 0; i < count; i++) {
		form.append('image', new File([`img${i}`], `p${i}.jpg`, { type: 'image/jpeg' }))
	}
	if (language) form.append('language', language)
	return new Request('http://localhost/api/recipe/parse/image', { method: 'POST', body: form })
}
const post = (request) => POST(fake({ request, locals: { user: { userId: 'u1' } } }))

beforeEach(() => {
	vi.clearAllMocks()
	vi.spyOn(console, 'error').mockImplementation(() => {})
	vi.mocked(resolveAIConfig).mockReturnValue(fake({ ok: true, provider: 'openai', model: 'm' }))
	vi.mocked(fileTypeFromBuffer).mockResolvedValue(fake({ mime: 'image/jpeg', ext: 'jpg' }))
	vi.mocked(extractRecipeWithLLM).mockResolvedValue(recipe)
})

describe('POST /api/recipe/parse/image', () => {
	it('requires a logged-in user', async () => {
		vi.mocked(requireAuth).mockImplementationOnce(() => {
			throw new Error('401')
		})
		await expect(post(imageRequest(1))).rejects.toThrow('401')
	})

	it('returns the AI config error when image AI is unavailable', async () => {
		const response = new Response('{}', { status: 503 })
		vi.mocked(resolveAIConfig).mockReturnValue(fake({ ok: false, response }))
		expect(await post(imageRequest(1))).toBe(response)
		expect(extractRecipeWithLLM).not.toHaveBeenCalled()
	})

	it('rejects a request without images', async () => {
		const res = await post(imageRequest(0))
		expect(res.status).toBe(400)
		expect((await res.json()).code).toBe('recipeNew.msg.noImage')
	})

	it('rejects files that are not images', async () => {
		vi.mocked(fileTypeFromBuffer).mockResolvedValue(fake({ mime: 'application/pdf', ext: 'pdf' }))
		const res = await post(imageRequest(1))
		expect(res.status).toBe(400)
		expect((await res.json()).code).toBe('recipeNew.msg.invalidImageType')
	})

	it('extracts a recipe from one photo in the requested language', async () => {
		const res = await post(imageRequest(1))
		expect(res.status).toBe(200)
		expect(await res.json()).toMatchObject({ name: 'Soup', _source: 'AI', _status: 'complete' })
		expect(stitchImages).not.toHaveBeenCalled()
		expect(extractRecipeWithLLM).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'image', provider: 'openai', language: 'deu' })
		)
	})

	it('stitches at most three photos into one image', async () => {
		await post(imageRequest(5))
		expect(vi.mocked(stitchImages).mock.calls[0][0]).toHaveLength(3)
		expect(extractRecipeWithLLM).toHaveBeenCalledWith(
			expect.objectContaining({ imageBuffer: Buffer.from('stitched') })
		)
	})

	it('returns 422 when the AI finds no recipe', async () => {
		vi.mocked(extractRecipeWithLLM).mockResolvedValue(fake({ _noRecipe: true }))
		const res = await post(imageRequest(1))
		expect(res.status).toBe(422)
		expect((await res.json()).code).toBe('recipeNew.msg.imageNoRecipe')
	})

	it('returns 422 for an incomplete recipe', async () => {
		vi.mocked(extractRecipeWithLLM).mockResolvedValue(fake({ name: 'Soup', ingredients: [] }))
		const res = await post(imageRequest(1))
		expect(res.status).toBe(422)
		expect((await res.json()).code).toBe('recipeNew.msg.imageParseIncomplete')
	})

	it('returns 500 when the provider call fails', async () => {
		vi.mocked(extractRecipeWithLLM).mockRejectedValue(new Error('rate limited'))
		const res = await post(imageRequest(1))
		expect(res.status).toBe(500)
		expect((await res.json()).error).toBe('rate limited')
	})
})
