import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/utils/parse/recipeParse', () => ({
	parseURL: vi.fn()
}))

vi.mock('$lib/utils/ai', () => ({
	extractRecipeWithLLM: vi.fn()
}))

vi.mock('$lib/server/aiHelpers', () => ({
	resolveAIConfig: vi.fn()
}))

import { parseURL } from '$lib/utils/parse/recipeParse'
import { extractRecipeWithLLM } from '$lib/utils/ai'
import { resolveAIConfig } from '$lib/server/aiHelpers'
import { GET as scrapeGet } from '../routes/api/recipe/scrape/[url]/+server.js'

describe('API Routes - /api/recipe/scrape/[url]', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		resolveAIConfig.mockReturnValue({
			ok: false,
			response: new Response(JSON.stringify({ error: 'AI disabled' }), { status: 503 })
		})
	})

	it('returns a partial scraper result when extraction is incomplete and AI is unavailable', async () => {
		parseURL.mockResolvedValue({
			parsedHTML: {
				name: 'Chef John’s Fresh Salmon Cakes',
				author: 'allrecipes.com',
				sourceUrl: 'https://www.allrecipes.com/recipe/239541/chef-johns-fresh-salmon-cakes/',
				ingredients: [],
				instructions: ['Gather all ingredients.']
			},
			html: '<html><body>recipe</body></html>'
		})

		const response = await scrapeGet({
			params: {
				url: encodeURIComponent(
					'https://www.allrecipes.com/recipe/239541/chef-johns-fresh-salmon-cakes/'
				)
			},
			locals: {}
		})
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data._status).toBe('partial')
		expect(data.name).toBe('Chef John’s Fresh Salmon Cakes')
		expect(data.instructions).toEqual(['Gather all ingredients.'])
		expect(extractRecipeWithLLM).not.toHaveBeenCalled()
	})

	it('returns an upstream error when the remote site blocks the scrape fetch', async () => {
		parseURL.mockRejectedValue(new Error('Upstream site returned HTTP 402 Payment Required'))

		const response = await scrapeGet({
			params: {
				url: encodeURIComponent(
					'https://www.allrecipes.com/recipe/239541/chef-johns-fresh-salmon-cakes/'
				)
			},
			locals: {}
		})
		const data = await response.json()

		expect(response.status).toBe(502)
		expect(data.message).toContain('HTTP 402')
		expect(extractRecipeWithLLM).not.toHaveBeenCalled()
	})

	it('attempts AI fallback when scrape failure still includes HTML content', async () => {
		const scrapeError = new Error('Upstream site returned HTTP 402 Payment Required')
		scrapeError.html = '<html><body>blocked page</body></html>'
		parseURL.mockRejectedValue(scrapeError)
		resolveAIConfig.mockReturnValue({
			ok: true,
			provider: 'openai',
			model: 'gpt-4o-mini'
		})
		extractRecipeWithLLM.mockResolvedValue({
			name: 'Recovered Recipe',
			ingredients: ['1 egg'],
			instructions: ['Cook it']
		})

		const response = await scrapeGet({
			params: {
				url: encodeURIComponent(
					'https://www.allrecipes.com/recipe/239541/chef-johns-fresh-salmon-cakes/'
				)
			},
			locals: {}
		})
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data._source).toBe('AI')
		expect(extractRecipeWithLLM).toHaveBeenCalledWith(
			expect.objectContaining({
				provider: 'openai',
				type: 'html',
				content: '<html><body>blocked page</body></html>'
			})
		)
	})
})
