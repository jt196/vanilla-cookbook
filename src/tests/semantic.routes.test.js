// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/server/prisma', () => ({ prisma: { recipe: { findMany: vi.fn() } } }))
vi.mock('$lib/utils/embeddings', async (importOriginal) => ({
	...(await importOriginal()),
	getEmbedding: vi.fn()
}))

import { prisma } from '$lib/server/prisma'
import { getEmbedding, serializeEmbedding } from '$lib/utils/embeddings'
import { GET } from '../routes/api/recipe/search/+server.js'
import { fake } from './helpers/fake.js'

const enabledSite = { semantic: { enabled: true, provider: 'openai', model: 'm' } }
const search = (q, locals = {}) =>
	GET(
		fake({
			url: new URL(`http://localhost/api/recipe/search?q=${encodeURIComponent(q)}`),
			locals: { site: enabledSite, ...locals }
		})
	)
const vec = (...values) => serializeEmbedding(new Float32Array(values))

beforeEach(() => {
	vi.clearAllMocks()
	vi.spyOn(console, 'error').mockImplementation(() => {})
	vi.mocked(getEmbedding).mockResolvedValue(new Float32Array([1, 0]))
	vi.mocked(prisma.recipe.findMany).mockResolvedValue([])
})

describe('GET /api/recipe/search', () => {
	it('returns no results without calling a provider when semantic search is disabled', async () => {
		const res = await search('curry', { site: { semantic: { enabled: false } } })
		const body = await res.json()
		expect(body).toMatchObject({ enabled: false, results: [] })
		expect(getEmbedding).not.toHaveBeenCalled()
		expect(prisma.recipe.findMany).not.toHaveBeenCalled()
	})

	it('only searches public recipes for logged-out visitors', async () => {
		await search('curry')
		expect(vi.mocked(prisma.recipe.findMany).mock.calls[0][0].where).toMatchObject({
			in_trash: false,
			is_public: true
		})
	})

	it("searches the user's own and public recipes when logged in", async () => {
		await search('curry', { user: { userId: 'u1' } })
		expect(vi.mocked(prisma.recipe.findMany).mock.calls[0][0].where).toMatchObject({
			in_trash: false,
			OR: [{ userId: 'u1' }, { is_public: true }]
		})
	})

	it('ranks results by similarity and drops ones below the threshold', async () => {
		vi.mocked(prisma.recipe.findMany).mockResolvedValue(
			fake([
				{ uid: 'far', embedding: vec(0, 1) },
				{ uid: 'close', embedding: vec(0.9, 0.1) },
				{ uid: 'exact', embedding: vec(1, 0) },
				{ uid: 'otherModel', embedding: vec(1, 0, 0) }
			])
		)
		const body = await (await search('curry')).json()
		expect(body.results.map((r) => r.uid)).toEqual(['exact', 'close'])
	})

	it('returns an empty result, not an error, when no provider gives an embedding', async () => {
		vi.mocked(getEmbedding).mockResolvedValue(null)
		const res = await search('curry')
		expect(res.status).toBe(200)
		expect((await res.json()).results).toEqual([])
	})

	it('returns a 500 with a code when the provider fails, so the feed falls back', async () => {
		vi.mocked(getEmbedding).mockRejectedValue(new Error('provider down'))
		const res = await search('curry')
		expect(res.status).toBe(500)
		expect((await res.json()).code).toBe('recipe.msg.searchFailed')
	})
})
