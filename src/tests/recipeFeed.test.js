import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/server/prisma', () => ({
	prisma: {
		recipe: { findMany: vi.fn() },
		recipeFavorite: { findMany: vi.fn() }
	}
}))

import { prisma } from '$lib/server/prisma'
import {
	loadRecipeFeed,
	mainPhoto,
	userRecipesWhere,
	visibleRecipesWhere
} from '$lib/server/recipeFeed'

describe('mainPhoto', () => {
	it('returns an empty list when there are no photos', () => {
		expect(mainPhoto([])).toEqual([])
		expect(mainPhoto(undefined)).toEqual([])
	})

	it('prefers the main photo regardless of order', () => {
		expect(
			mainPhoto([
				{ id: 'a', isMain: false },
				{ id: 'c', isMain: true },
				{ id: 'b', isMain: false }
			])
		).toEqual([{ id: 'c' }])
	})

	it('falls back to the lowest id, treating null isMain as false', () => {
		expect(
			mainPhoto([
				{ id: 'b', isMain: null },
				{ id: 'a', isMain: false }
			])
		).toEqual([{ id: 'a' }])
	})
})

describe('visibility filters', () => {
	const owner = { userId: 'u1' }
	const other = { userId: 'u2' }
	const admin = { userId: 'admin', isAdmin: true }

	it('visibleRecipesWhere: admin sees all, user sees own + public, anon sees public', () => {
		expect(visibleRecipesWhere(admin)).toEqual({ in_trash: false })
		expect(visibleRecipesWhere(owner)).toEqual({
			in_trash: false,
			OR: [{ userId: 'u1' }, { is_public: true }]
		})
		expect(visibleRecipesWhere(null)).toEqual({ in_trash: false, is_public: true })
	})

	it('userRecipesWhere: everyone except the owner sees only public, untrashed recipes', () => {
		expect(userRecipesWhere('u1', null)).toEqual({
			in_trash: false,
			userId: 'u1',
			is_public: true
		})
		expect(userRecipesWhere('u1', other)).toEqual(userRecipesWhere('u1', null))
	})

	it('userRecipesWhere: admins see all of the user’s untrashed recipes', () => {
		expect(userRecipesWhere('u1', admin)).toEqual({ in_trash: false, userId: 'u1' })
	})

	it('userRecipesWhere: owners also see public recipes they favourited', () => {
		expect(userRecipesWhere('u1', owner)).toEqual({
			in_trash: false,
			OR: [{ userId: 'u1' }, { is_public: true, favorites: { some: { userId: 'u1' } } }]
		})
	})
})

describe('loadRecipeFeed', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('never orders or limits nested relations (keeps Prisma able to chunk IN lists)', async () => {
		prisma.recipe.findMany.mockResolvedValue([])
		await loadRecipeFeed({ in_trash: false }, null)

		const { select } = prisma.recipe.findMany.mock.calls[0][0]
		for (const [field, value] of Object.entries(select)) {
			if (value && typeof value === 'object') {
				expect(value, `nested relation "${field}"`).not.toHaveProperty('orderBy')
				expect(value, `nested relation "${field}"`).not.toHaveProperty('take')
			}
		}
	})

	it('skips the viewer lookups for anonymous visitors', async () => {
		prisma.recipe.findMany.mockResolvedValue([{ uid: 'r1', photos: [] }])
		const feed = await loadRecipeFeed({}, null)

		expect(prisma.recipeFavorite.findMany).not.toHaveBeenCalled()
		expect(feed).toEqual([
			{ uid: 'r1', photos: [], on_favorites: false, duplicatedByViewer: false }
		])
	})

	it('annotates favourites, copies and the display photo for a viewer', async () => {
		prisma.recipe.findMany
			.mockResolvedValueOnce([
				{
					uid: 'r1',
					photos: [
						{ id: 'p2', isMain: false },
						{ id: 'p9', isMain: true }
					]
				},
				{ uid: 'r2', photos: [{ id: 'p1', isMain: false }] }
			])
			.mockResolvedValueOnce([{ parentRecipeId: 'r2' }])
		prisma.recipeFavorite.findMany.mockResolvedValue([{ recipeUid: 'r1' }])

		const feed = await loadRecipeFeed({}, { userId: 'u1' })

		expect(feed).toEqual([
			{ uid: 'r1', photos: [{ id: 'p9' }], on_favorites: true, duplicatedByViewer: false },
			{ uid: 'r2', photos: [{ id: 'p1' }], on_favorites: false, duplicatedByViewer: true }
		])
		// Viewer lookups are scoped by user, not by an IN list of the loaded recipe uids
		expect(prisma.recipeFavorite.findMany.mock.calls[0][0].where).toEqual({ userId: 'u1' })
		expect(prisma.recipe.findMany.mock.calls[1][0].where).toEqual({
			userId: 'u1',
			parentRecipeId: { not: null }
		})
	})
})
