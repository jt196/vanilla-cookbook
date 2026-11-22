import { describe, it, expect } from 'vitest'
import {
	parseMarker,
	findMarkers,
	resolveMarker,
	stripIngredientMarkers,
	findUnresolvedMarkers,
	toggleIngredientMarker
} from '$lib/utils/ingredientMarkers'
import { parseRecipeText } from '$lib/utils/converter'

/** Apply a TextEdit to a string, returning the new value and selection for easy asserts. */
function apply(value, edit) {
	return {
		value: value.slice(0, edit.start) + edit.text + value.slice(edit.end),
		selection: [edit.selectStart, edit.selectEnd]
	}
}

const onion = { ingredient: 'onion', quantity: 1, unit: null, minQty: 1, maxQty: 1 }
const flour = {
	ingredient: 'plain flour',
	quantity: 150,
	unit: 'gram',
	unitPlural: 'grams',
	symbol: 'g',
	minQty: 150,
	maxQty: 150
}
const sugarDough = {
	ingredient: 'sugar',
	quantity: 100,
	unit: 'gram',
	unitPlural: 'grams',
	symbol: 'g',
	minQty: 100,
	maxQty: 100
}
const sugarTopping = { ...sugarDough, quantity: 20, minQty: 20, maxQty: 20 }
const salt = { ingredient: 'salt', quantity: null, unit: null, minQty: null, maxQty: null }

describe('parseMarker', () => {
	it.each([
		['onion', { name: 'onion', occurrence: 1, factor: 1 }],
		[' red onion ', { name: 'red onion', occurrence: 1, factor: 1 }],
		['sugar#2', { name: 'sugar', occurrence: 2, factor: 1 }],
		['sugar*0.5', { name: 'sugar', occurrence: 1, factor: 0.5 }],
		['sugar*0,5', { name: 'sugar', occurrence: 1, factor: 0.5 }],
		['sugar * 1/2', { name: 'sugar', occurrence: 1, factor: 0.5 }],
		['sugar#2*1/4', { name: 'sugar', occurrence: 2, factor: 0.25 }]
	])('parses %j', (inner, expected) => {
		expect(parseMarker(inner)).toEqual(expected)
	})

	it.each(['', '   ', 'sugar#0', 'sugar*0', 'sugar*1/0', '#2', 'a<b'])('rejects %j', (inner) => {
		expect(parseMarker(inner)).toBeNull()
	})
})

describe('findMarkers', () => {
	it('finds markers with their positions', () => {
		const text = 'Fry {onion}, then add {sugar#2*1/2}.'
		const markers = findMarkers(text)
		expect(markers.map((m) => text.slice(m.start, m.end))).toEqual(['{onion}', '{sugar#2*1/2}'])
		expect(markers[1]).toMatchObject({ name: 'sugar', occurrence: 2, factor: 0.5 })
	})

	it('ignores braces that are not markers', () => {
		expect(findMarkers('Empty {} and\n{multi\nline} braces')).toEqual([])
	})
})

describe('resolveMarker', () => {
	const ingredients = [onion, flour, sugarDough, sugarTopping, salt]
	const resolve = (inner) => resolveMarker(parseMarker(inner), ingredients)

	it('matches names case-insensitively, including plurals', () => {
		expect(resolve('onion')).toBe(0)
		expect(resolve('Onions')).toBe(0)
		expect(resolve('SALT')).toBe(4)
	})

	it('only matches the bare ingredient name, not part of it', () => {
		expect(resolve('flour')).toBe(-1)
		expect(resolve('plain flour')).toBe(1)
		expect(resolve('Plain  Flour')).toBe(1)
		expect(resolve('chopped onion')).toBe(-1)
	})

	it('picks the nth matching ingredient with #n', () => {
		expect(resolve('sugar')).toBe(2)
		expect(resolve('sugar#2')).toBe(3)
		expect(resolve('sugar#3')).toBe(-1)
	})

	it('does not guess between similar ingredients', () => {
		const list = [{ ingredient: 'olive oil' }, { ingredient: 'sesame oil' }]
		expect(resolveMarker(parseMarker('oil'), list)).toBe(-1)
		expect(resolveMarker(parseMarker('sesame oil'), list)).toBe(1)
	})

	it('does not match other word forms beyond simple plurals', () => {
		const list = [{ ingredient: 'Zwiebel' }, { ingredient: 'pea' }, { ingredient: 'chicken stock' }]
		expect(resolveMarker(parseMarker('Zwiebel'), list)).toBe(0)
		expect(resolveMarker(parseMarker('Zwiebeln'), list)).toBe(-1)
		expect(resolveMarker(parseMarker('peas'), list)).toBe(1)
		expect(resolveMarker(parseMarker('peach'), list)).toBe(-1)
		expect(resolveMarker(parseMarker('chicken'), list)).toBe(-1)
	})

	it('does not match unrelated words', () => {
		expect(resolve('butter')).toBe(-1)
		expect(resolveMarker(parseMarker('onion'), [])).toBe(-1)
		expect(resolveMarker(parseMarker('onion'), null)).toBe(-1)
	})

	it('skips Markdown heading lines', () => {
		expect(resolveMarker(parseMarker('dough'), [{ ingredient: '# Dough' }])).toBe(-1)
		const parsedHeading = { ingredient: 'Dough', originalString: '# Dough' }
		expect(resolveMarker(parseMarker('dough'), [parsedHeading])).toBe(-1)
	})
})

describe('stripIngredientMarkers', () => {
	it('replaces markers with their names', () => {
		expect(stripIngredientMarkers('Fry {onion}, add {sugar#2*1/2}.')).toBe('Fry onion, add sugar.')
	})

	it('leaves non-marker braces and empty input alone', () => {
		expect(stripIngredientMarkers('a {} b')).toBe('a {} b')
		expect(stripIngredientMarkers('')).toBe('')
		expect(stripIngredientMarkers(null)).toBe(null)
	})
})

describe('findUnresolvedMarkers', () => {
	it('lists markers without a matching ingredient, once each', () => {
		const text = 'Add {onion} and {butter}.\nMore {butter}, then {sugar#2}.'
		expect(findUnresolvedMarkers(text, [onion, sugarDough])).toEqual(['{butter}', '{sugar#2}'])
	})
})

describe('toggleIngredientMarker', () => {
	it('wraps the selection', () => {
		const value = 'Add the onion now'
		const edit = toggleIngredientMarker(value, 8, 13)
		expect(apply(value, edit)).toEqual({ value: 'Add the {onion} now', selection: [9, 14] })
	})

	it('keeps surrounding whitespace outside the braces', () => {
		const value = 'Add the onion now'
		expect(apply(value, toggleIngredientMarker(value, 7, 14)).value).toBe('Add the {onion} now')
	})

	it('wraps the word at the cursor when nothing is selected', () => {
		const value = 'Add the Zwiebeln now'
		expect(apply(value, toggleIngredientMarker(value, 10, 10)).value).toBe('Add the {Zwiebeln} now')
	})

	it('unwraps when the cursor is inside a marker', () => {
		const value = 'Add the {onion} now'
		expect(apply(value, toggleIngredientMarker(value, 11, 11))).toEqual({
			value: 'Add the onion now',
			selection: [8, 13]
		})
	})

	it('unwraps when the selection is the marker or its content', () => {
		const value = 'Add the {onion} now'
		expect(apply(value, toggleIngredientMarker(value, 8, 15)).value).toBe('Add the onion now')
		expect(apply(value, toggleIngredientMarker(value, 9, 14)).value).toBe('Add the onion now')
	})

	it('returns null when there is nothing to wrap', () => {
		expect(toggleIngredientMarker('Add  now', 4, 4)).toBeNull()
		expect(toggleIngredientMarker('', 0, 0)).toBeNull()
	})
})

describe('parseRecipeText with ingredient markers', () => {
	const ingredients = [onion, flour, sugarDough, sugarTopping, salt]
	const render = (text, opts = {}, system = 'metric') =>
		parseRecipeText([text], system, 'metric', ingredients, 'eng', opts)[0]

	it('shows the amount after a marked ingredient', () => {
		expect(render('Sift the {plain flour}.')).toBe(
			'Sift the <span class="text-primary"><b>plain flour</b> <span class="whitespace-nowrap">(150 grams)</span></span>.'
		)
	})

	it('scales the amount and uses symbols when asked', () => {
		expect(render('Sift the {plain flour}.', { scale: 2, useSymbol: true })).toContain('(300 g)')
	})

	it('applies the marker factor and picks the nth ingredient', () => {
		expect(render('Add {sugar#2*1/2}.', { useSymbol: true })).toContain('(10 g)')
	})

	it('shows a bare count for ingredients without a unit', () => {
		expect(render('Dice the {onion}.', { scale: 2 })).toContain(
			'<b>onion</b> <span class="whitespace-nowrap">(2)</span>'
		)
	})

	it('highlights without an amount when the ingredient has no quantity', () => {
		expect(render('Season with {salt}.')).toBe(
			'Season with <span class="text-primary"><b>salt</b></span>.'
		)
	})

	it('uses the plural unit when the top of a range is above 1', () => {
		const garlic = {
			ingredient: 'garlic',
			quantity: 1,
			unit: 'clove',
			unitPlural: 'cloves',
			minQty: 1,
			maxQty: 2
		}
		const html = (text) => parseRecipeText([text], 'metric', 'metric', [garlic], 'eng')[0]
		expect(html('Crush the {garlic}.')).toContain('(1-2 cloves)')
		expect(html('Crush the {garlic*1/2}.')).toContain('(0.5-1 clove)')
	})

	it('renders unresolved markers as plain text', () => {
		expect(render('Add {butter}.')).toBe('Add butter.')
	})

	it('keeps highlighting unmarked mentions without an amount', () => {
		expect(render('Dice the onion, then fry the {onion}.')).toBe(
			'Dice the <span class="text-primary"><b>onion</b></span>, then fry the <span class="text-primary"><b>onion</b> <span class="whitespace-nowrap">(1)</span></span>.'
		)
	})

	it('escapes HTML in the marker name', () => {
		const list = [{ ingredient: 'mac & cheese', quantity: 1, unit: null }]
		const html = parseRecipeText(['Heat {mac & cheese}.'], 'metric', 'metric', list, 'eng')[0]
		expect(html).toContain('<b>mac &amp; cheese</b>')
	})

	it('does not let temperature parsing touch the inserted amount', () => {
		const list = [{ ingredient: 'milk', quantity: 1, unit: 'cup', unitPlural: 'cups', symbol: 'c' }]
		const html = parseRecipeText(
			['Warm the {milk} to 40C.'],
			'americanVolumetric',
			'metric',
			list,
			'eng',
			{
				useSymbol: true
			}
		)[0]
		expect(html).toContain('<b>milk</b> <span class="whitespace-nowrap">(1 c)</span>')
	})

	it('keeps the spaces around a marker when temperature parsing trims the text', () => {
		const list = [{ ingredient: 'butter', quantity: 50, unit: 'gram', symbol: 'g' }]
		const html = parseRecipeText(
			['Heat to 180C (350F) and melt the {butter} slowly.'],
			'metric',
			'metric',
			list,
			'eng',
			{ useSymbol: true }
		)[0]
		expect(html).toContain('melt the <span class="text-primary"><b>butter</b>')
		expect(html).toContain('(50 g)</span></span> slowly.')
		expect(html).toContain('<b>180C</b>')
	})

	it('strips markers to plain names when no ingredients are given', () => {
		expect(parseRecipeText(['Add {butter}.'], 'metric', 'metric', null, 'eng')[0]).toBe(
			'Add butter.'
		)
	})
})
