import { describe, it, expect } from 'vitest'
import { load } from '../routes/new/+page.server.js'

import { fake } from './helpers/fake.js'
describe('Route - /new redirect', () => {
	it('redirects legacy /new requests to /recipe/new preserving query params', () => {
		try {
			load(
				fake({
					url: new URL('http://localhost:5173/new?url=https%3A%2F%2Fexample.com%2Frecipe')
				})
			)
		} catch (err) {
			expect(err.status).toBe(307)
			expect(err.location).toBe('/recipe/new?url=https%3A%2F%2Fexample.com%2Frecipe')
			return
		}

		throw new Error('Expected redirect to be thrown')
	})
})
