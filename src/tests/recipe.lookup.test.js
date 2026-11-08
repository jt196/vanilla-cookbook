import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/server/prisma', () => ({
	prisma: { recipe: { findMany: vi.fn() } }
}))

import { prisma } from '$lib/server/prisma'
import { GET } from '../routes/api/recipe/lookup/+server.js'

const lookup = async (q, user = null) => {
	const res = await GET({
		url: new URL(`http://localhost/api/recipe/lookup?q=${encodeURIComponent(q)}`),
		locals: { user }
	})
	return res.json()
}

beforeEach(() => {
	vi.clearAllMocks()
	prisma.recipe.findMany.mockResolvedValue([])
})

describe('GET /api/recipe/lookup', () => {
	it('returns nothing for empty or one-character queries without querying', async () => {
		expect(await lookup('')).toEqual({ results: [] })
		expect(await lookup(' a ')).toEqual({ results: [] })
		expect(prisma.recipe.findMany).not.toHaveBeenCalled()
	})

	it('requires every word in the name and limits to recipes the viewer can see', async () => {
		await lookup('chicken  soup', { userId: 'u1' })
		const { where } = prisma.recipe.findMany.mock.calls[0][0]
		expect(where).toEqual({
			in_trash: false,
			OR: [{ userId: 'u1' }, { is_public: true }],
			AND: [{ name: { contains: 'chicken' } }, { name: { contains: 'soup' } }]
		})
	})

	it('only searches public recipes for anonymous visitors', async () => {
		await lookup('soup')
		expect(prisma.recipe.findMany.mock.calls[0][0].where).toMatchObject({ is_public: true })
	})

	const row = (uid, name, userId = 'u1', photos = []) => ({
		uid,
		name,
		userId,
		image_url: null,
		auth_user: { username: userId === 'u1' ? 'me' : 'matteo' },
		photos
	})

	it('ranks names starting with the query, then word starts, then other matches', async () => {
		prisma.recipe.findMany.mockResolvedValue([
			// The database has already filtered to names containing "chick"
			row('mid', 'Vegan unchicken stew'),
			row('pho', '30-Minute Pho Ga (Chicken Noodle Soup)'),
			row('long', 'Chicken and leek pie with a crispy lid'),
			row('short', 'Chicken pie')
		])
		const { results } = await lookup('chick', { userId: 'u1' })
		expect(results.map((r) => r.uid)).toEqual(['short', 'long', 'pho', 'mid'])
	})

	it('puts the viewer’s recipes first among equal matches and names other authors', async () => {
		prisma.recipe.findMany.mockResolvedValue([
			row('theirs', 'Soup', 'u2'),
			row('mine', 'Soup', 'u1', [
				{ id: 'b', isMain: false },
				{ id: 'a', isMain: true }
			])
		])
		const { results } = await lookup('soup', { userId: 'u1' })
		expect(results).toEqual([
			{
				uid: 'mine',
				name: 'Soup',
				image_url: null,
				mine: true,
				author: null,
				photos: [{ id: 'a' }]
			},
			{ uid: 'theirs', name: 'Soup', image_url: null, mine: false, author: 'matteo', photos: [] }
		])
	})

	it('returns at most 8 results', async () => {
		prisma.recipe.findMany.mockResolvedValue(
			Array.from({ length: 12 }, (_, i) => row(`r${i}`, `Soup ${i}`))
		)
		expect((await lookup('soup', { userId: 'u1' })).results).toHaveLength(8)
	})
})
