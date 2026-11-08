import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parse } from 'node-html-parser'
import {
	extractMicrodata,
	isRecipeType,
	parseJSONLD,
	parseKeywords,
	parseUsingSiteConfig
} from '$lib/utils/parse/parseHelpers.js'

const page = (body) =>
	parse(`<html><head><title>Page title</title></head><body>${body}</body></html>`)
const ld = (data) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`

beforeEach(() => {
	vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('isRecipeType', () => {
	it.each([['Recipe'], ['recipe'], [['NewsArticle', 'Recipe']]])('matches %j', (type) => {
		expect(isRecipeType(type)).toBe(true)
	})

	it.each([['Article'], [undefined], [['WebPage']], [42]])('rejects %j', (type) => {
		expect(isRecipeType(type)).toBe(false)
	})
})

describe('parseJSONLD', () => {
	it('finds a Recipe among other blocks', () => {
		const root = page(
			ld({ '@type': 'WebSite', name: 'Site' }) +
				ld({ '@type': 'Recipe', name: 'Soup', recipeIngredient: ['water'] })
		)
		expect(parseJSONLD(root)).toMatchObject({ name: 'Soup' })
	})

	it('finds a Recipe nested in @graph or an array', () => {
		const graph = page(ld({ '@graph': [{ '@type': 'WebPage' }, { '@type': 'Recipe', name: 'A' }] }))
		const array = page(ld([{ '@type': 'Person' }, { '@type': ['Recipe'], name: 'B' }]))
		expect(parseJSONLD(graph)).toMatchObject({ name: 'A' })
		expect(parseJSONLD(array)).toMatchObject({ name: 'B' })
	})

	it('prefers a Recipe with ingredients over an earlier one without', () => {
		const root = page(
			ld({ '@type': 'Recipe', name: 'Teaser' }) +
				ld({ '@type': 'Recipe', name: 'Full', recipeIngredient: ['x'] })
		)
		expect(parseJSONLD(root)).toMatchObject({ name: 'Full' })
	})

	it('skips invalid JSON blocks', () => {
		const root = page(
			'<script type="application/ld+json">{ not json</script>' +
				ld({ '@type': 'Recipe', name: 'Ok' })
		)
		expect(parseJSONLD(root)).toMatchObject({ name: 'Ok' })
	})

	it('tolerates raw newlines inside string values', () => {
		const root = page(
			'<script type="application/ld+json">{"@type":"Recipe","name":"Two\nlines"}</script>'
		)
		expect(parseJSONLD(root)).toMatchObject({ name: 'Two lines' })
	})

	describe('without a Recipe', () => {
		it('returns the last block as partial data when it is a plain object', () => {
			const root = page(
				ld({ '@type': 'WebSite', name: 'Site' }) +
					ld({ '@type': 'Article', name: 'Post', author: 'Ann' })
			)
			expect(parseJSONLD(root)).toMatchObject({ name: 'Post', author: 'Ann' })
		})

		it('returns null when the last block is a @graph or an array', () => {
			expect(parseJSONLD(page(ld({ '@graph': [{ '@type': 'Article' }] })))).toBeNull()
			expect(parseJSONLD(page(ld([{ '@type': 'Article' }])))).toBeNull()
		})

		it('returns null when the page has no JSON-LD', () => {
			expect(parseJSONLD(page('<p>hi</p>'))).toBeNull()
		})
	})
})

describe('extractMicrodata', () => {
	const recipeScope = (inner) =>
		page(`<div itemscope itemtype="https://schema.org/Recipe">${inner}</div>`)

	it('treats each recipeInstructions element as one step', () => {
		const root = recipeScope(
			'<li itemprop="recipeInstructions">Mix</li><li itemprop="recipeInstructions">Bake</li>'
		)
		expect(extractMicrodata(root).recipeInstructions).toEqual(['Mix', 'Bake'])
	})

	it('splits a legacy instructions container into its child elements', () => {
		const root = recipeScope('<ol itemprop="instructions"><li>Mix</li><li>Bake</li></ol>')
		expect(extractMicrodata(root).recipeInstructions).toEqual(['Mix', 'Bake'])
	})

	it('reads ingredients from recipeIngredient, ingredients, or amount/name parts', () => {
		expect(
			extractMicrodata(recipeScope('<span itemprop="recipeIngredient">1 egg</span>'))
				.recipeIngredient
		).toEqual(['1 egg'])
		expect(
			extractMicrodata(recipeScope('<span itemprop="ingredients">2 eggs</span>')).recipeIngredient
		).toEqual(['2 eggs'])
		expect(
			extractMicrodata(
				recipeScope(
					'<span itemprop="ingredient"><span itemprop="amount">3</span> <span itemprop="name">eggs</span></span>' +
						'<span itemprop="ingredient"><span itemprop="name">salt</span></span>'
				)
			).recipeIngredient
		).toEqual(['3 eggs', 'salt'])
	})

	it('uses meta content and nested item properties', () => {
		const data = extractMicrodata(
			recipeScope(
				'<span itemprop="name">Cake</span><meta itemprop="prepTime" content="PT10M">' +
					'<div itemprop="aggregateRating"><meta itemprop="ratingValue" content="4.5"><span itemprop="ratingCount">12</span></div>'
			)
		)
		expect(data).toMatchObject({
			name: 'Cake',
			prepTime: 'PT10M',
			aggregateRating: { ratingValue: '4.5', ratingCount: '12' }
		})
	})

	it('uses the page title as the name when there is no Recipe scope', () => {
		const root = page('<span itemprop="name">Not the recipe</span>')
		expect(extractMicrodata(root).name).toBe('Page title')
	})
})

describe('parseUsingSiteConfig', () => {
	it('reads single and multiple values by selector, trimming and skipping blanks', () => {
		const root = page(
			'<h1 class="t"> Pie </h1><li class="i"> flour </li><li class="i">  </li><li class="i">butter</li>'
		)
		const data = parseUsingSiteConfig(root, { nameSelector: '.t', ingredientsSelector: '.i' })
		expect(data.name).toBe('Pie')
		expect(data.recipeIngredient).toEqual(['flour', 'butter'])
		expect(data.prepTime).toBeNull()
		expect(data.recipeInstructions).toEqual([])
	})
})

describe('parseKeywords', () => {
	it('accepts a comma-separated string or a list', () => {
		expect(parseKeywords('a, b ,c')).toEqual(['a', 'b', 'c'])
		expect(parseKeywords([' a ', 'b'])).toEqual(['a', 'b'])
		expect(parseKeywords(undefined)).toEqual([])
	})
})
