import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
	handleHTMLFile,
	handleImage,
	handleParse,
	handleScrape,
	handleYouTubeScrape,
	isBlockedScrapeErrorMessage
} from '$lib/utils/parse/parseHelpersClient'

const json = (status, body) =>
	new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const rawRecipe = {
	name: 'Soup',
	author: 'Ann',
	sourceUrl: 'https://example.com/soup',
	ingredients: ['water', 'salt'],
	instructions: ['Boil', 'Season'],
	_source: 'scraper',
	_status: 'complete'
}

describe('parseHelpersClient', () => {
	let fetchMock

	beforeEach(() => {
		fetchMock = vi.fn()
		vi.stubGlobal('fetch', fetchMock)
		vi.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	describe('handleScrape', () => {
		it('calls preventDefault and returns the formatted recipe with source/status', async () => {
			fetchMock.mockResolvedValue(json(200, rawRecipe))
			const event = { preventDefault: vi.fn() }
			const result = await handleScrape(event, 'https://example.com/soup')

			expect(event.preventDefault).toHaveBeenCalled()
			expect(fetchMock.mock.calls[0][0]).toBe(
				`/api/recipe/scrape/${encodeURIComponent('https://example.com/soup')}`
			)
			expect(result).toMatchObject({
				name: 'Soup',
				source: 'Ann',
				source_url: 'https://example.com/soup',
				ingredients: 'water\nsalt',
				directions: 'Boil\n\nSeason',
				_source: 'scraper',
				_status: 'complete'
			})
		})

		it('throws the server message and code', async () => {
			fetchMock.mockResolvedValue(json(422, { message: null, code: 'recipeNew.msg.tiktokBlocked' }))
			await expect(handleScrape(null, 'https://tiktok.com/x')).rejects.toMatchObject({
				message: 'Error scraping recipe',
				code: 'recipeNew.msg.tiktokBlocked'
			})
		})

		it('turns upstream 402/403 errors into guidance', async () => {
			fetchMock.mockResolvedValue(
				json(502, { message: 'Upstream site returned HTTP 402 Payment Required' })
			)
			const error = await handleScrape(null, 'https://example.com').catch((e) => e)
			expect(error.message).toMatch(/blocked the server-side scrape request/)
			expect(isBlockedScrapeErrorMessage(error.message)).toBe(true)
		})

		it('tolerates a non-JSON error body', async () => {
			fetchMock.mockResolvedValue(new Response('Bad gateway', { status: 502 }))
			await expect(handleScrape(null, 'https://example.com')).rejects.toMatchObject({
				message: 'Error scraping recipe'
			})
		})

		it('reports a timeout with its own code', async () => {
			fetchMock.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }))
			await expect(handleScrape(null, 'https://example.com')).rejects.toMatchObject({
				code: 'recipeNew.msg.scrapeTimeout'
			})
		})

		it('reports network failures without a code', async () => {
			fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
			const error = await handleScrape(null, 'https://example.com').catch((e) => e)
			expect(error.message).toBe('Failed to fetch')
			expect(error.code ?? null).toBeNull()
		})
	})

	describe('handleParse / handleImage / handleHTMLFile', () => {
		const file = new File(['x'], 'r.html', { type: 'text/html' })
		const cases = [
			['handleParse', () => handleParse(null, 'text', { language: 'deu' }), '/api/recipe/parse'],
			['handleImage', () => handleImage(null, [file]), '/api/recipe/parse/image'],
			['handleHTMLFile', () => handleHTMLFile(null, file), '/api/recipe/parse/html']
		]

		it.each(cases)('%s POSTs and formats the result', async (_, call, url) => {
			fetchMock.mockResolvedValue(json(200, { ...rawRecipe, _source: 'AI' }))
			const result = await call()
			expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({ method: 'POST' }))
			expect(result).toMatchObject({ name: 'Soup', ingredients: 'water\nsalt', _source: 'AI' })
		})

		it.each(cases)('%s throws the server error and code', async (_, call) => {
			fetchMock.mockResolvedValue(json(422, { error: 'No recipe', code: 'x.y' }))
			await expect(call()).rejects.toMatchObject({ message: 'No recipe', code: 'x.y' })
		})

		it('handleParse sends text, mode, units and language', async () => {
			fetchMock.mockResolvedValue(json(200, rawRecipe))
			await handleParse(null, 'make soup', { mode: 'prompt', unitsPreference: 'metric' })
			expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
				text: 'make soup',
				mode: 'prompt',
				unitsPreference: 'metric',
				language: 'eng'
			})
		})

		it('handleImage requires an image and sends at most 5 plus the language', async () => {
			await expect(handleImage(null, [])).rejects.toMatchObject({ code: 'recipeNew.msg.noImage' })

			fetchMock.mockResolvedValue(json(200, rawRecipe))
			await handleImage(null, Array(7).fill(file), 'ita')
			const body = fetchMock.mock.calls[0][1].body
			expect(body.getAll('image')).toHaveLength(5)
			expect(body.get('language')).toBe('ita')
		})

		it('handleImage accepts a single file', async () => {
			fetchMock.mockResolvedValue(json(200, rawRecipe))
			await handleImage(null, file)
			expect(fetchMock.mock.calls[0][1].body.getAll('image')).toHaveLength(1)
		})

		it('handleHTMLFile requires a file', async () => {
			await expect(handleHTMLFile(null, null)).rejects.toMatchObject({
				code: 'recipeNew.msg.noFile'
			})
			expect(fetchMock).not.toHaveBeenCalled()
		})
	})

	describe('handleYouTubeScrape', () => {
		const stageOf = (call) => JSON.parse(call[1].body).stage

		it('runs stages in order until one finds a recipe, reporting progress', async () => {
			fetchMock
				.mockResolvedValueOnce(json(200, { _noRecipe: true }))
				.mockResolvedValueOnce(json(200, { ...rawRecipe, _source: 'YouTube (description)' }))
			const onProgress = vi.fn()

			const result = await handleYouTubeScrape(null, 'https://youtu.be/abc', { onProgress })

			expect(fetchMock.mock.calls.map(stageOf)).toEqual(['links', 'description'])
			expect(onProgress.mock.calls.map((c) => c[0])).toEqual([
				'recipeNew.msg.youtubeCheckingLinks',
				'recipeNew.msg.youtubeParsingDescription'
			])
			expect(result).toMatchObject({ name: 'Soup', _source: 'YouTube (description)' })
		})

		it('throws youtubeNoRecipe when no stage finds one', async () => {
			fetchMock.mockImplementation(async () => json(200, { _noRecipe: true }))
			await expect(handleYouTubeScrape(null, 'https://youtu.be/abc')).rejects.toMatchObject({
				code: 'recipeNew.msg.youtubeNoRecipe'
			})
			expect(fetchMock.mock.calls.map(stageOf)).toEqual(['links', 'description', 'transcript'])
		})

		it('throws an empty-message coded error when AI is unavailable', async () => {
			fetchMock
				.mockResolvedValueOnce(json(200, { _noRecipe: true }))
				.mockResolvedValueOnce(json(422, { _noAi: true, code: 'recipeNew.msg.youtubeNoAi' }))
			await expect(handleYouTubeScrape(null, 'https://youtu.be/abc')).rejects.toMatchObject({
				message: '',
				code: 'recipeNew.msg.youtubeNoAi'
			})
		})

		it('throws server errors from a stage', async () => {
			fetchMock.mockResolvedValueOnce(json(400, { error: 'Missing url.' }))
			await expect(handleYouTubeScrape(null, 'https://youtu.be/abc')).rejects.toMatchObject({
				message: 'Missing url.'
			})
		})
	})
})
