import { describe, it, expect } from 'vitest'
import {
	addRecent,
	getRecentRecipes,
	MAX_RECENT,
	rememberRecipe,
	toRecent
} from '$lib/utils/recentRecipes'

import { fake } from './helpers/fake.js'
function memoryStorage(initial = {}) {
	const data = { ...initial }
	return {
		getItem: (key) => (key in data ? data[key] : null),
		setItem: (key, value) => {
			data[key] = String(value)
		},
		data
	}
}

const recipe = (uid, extra = {}) => ({ uid, name: `Recipe ${uid}`, ...extra })

describe('recentRecipes', () => {
	it('keeps the most recent first, without duplicates, capped', () => {
		let list = []
		for (const uid of ['a', 'b', 'c', 'a']) list = addRecent(list, toRecent(recipe(uid)))
		expect(list.map((r) => r.uid)).toEqual(['a', 'c', 'b'])

		for (let i = 0; i < 10; i++) list = addRecent(list, toRecent(recipe(`r${i}`)))
		expect(list).toHaveLength(MAX_RECENT)
		expect(list[0].uid).toBe('r9')
	})

	it('stores the main photo, else the first, else the image URL', () => {
		expect(
			toRecent(
				recipe('a', {
					photos: [
						{ id: 'p1', isMain: false },
						{ id: 'p2', isMain: true }
					]
				})
			)
		).toEqual({ uid: 'a', name: 'Recipe a', photoId: 'p2', image_url: null })
		expect(toRecent(recipe('b', { photos: [{ id: 'p1' }] })).photoId).toBe('p1')
		expect(toRecent(recipe('c', { photos: [], image_url: 'https://x/y.jpg' }))).toMatchObject({
			photoId: null,
			image_url: 'https://x/y.jpg'
		})
	})

	it('remembers per user, separately from visitors', () => {
		const storage = memoryStorage()
		rememberRecipe('u1', recipe('a'), fake(storage))
		rememberRecipe(null, recipe('b'), fake(storage))

		expect(getRecentRecipes('u1', fake(storage)).map((r) => r.uid)).toEqual(['a'])
		expect(getRecentRecipes(null, fake(storage)).map((r) => r.uid)).toEqual(['b'])
		expect(getRecentRecipes('u2', fake(storage))).toEqual([])
	})

	it('survives corrupt or unavailable storage', () => {
		expect(getRecentRecipes('u1', fake(memoryStorage({ 'vanilla:recent:u1': '{nope' })))).toEqual(
			[]
		)
		expect(
			getRecentRecipes('u1', fake(memoryStorage({ 'vanilla:recent:u1': '[{"uid":"x"},"junk"]' })))
		).toEqual([])

		const blocked = {
			getItem: () => {
				throw new Error('SecurityError')
			},
			setItem: () => {
				throw new Error('SecurityError')
			}
		}
		expect(getRecentRecipes('u1', fake(blocked))).toEqual([])
		expect(() => rememberRecipe('u1', recipe('a'), fake(blocked))).not.toThrow()
	})
})
