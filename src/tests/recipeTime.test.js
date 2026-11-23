import { describe, it, expect } from 'vitest'
import {
	parseRecipeTime,
	recipeTimeFields,
	recipeReadyMinutes,
	minutesToIso
} from '$lib/utils/recipeTime'
import { durationToText } from '$lib/utils/parse/parseHelpers'

describe('parseRecipeTime', () => {
	it.each([
		['20 mins', 'PT20M', 20],
		['1 hour, 35 minutes', 'PT1H35M', 95],
		['3 hours 30 minutes', 'PT3H30M', 210],
		['1hr 20 mins', 'PT1H20M', 80],
		['110 mins', 'PT1H50M', 110],
		['1h30', 'PT1H30M', 90],
		['2 Std 15', 'PT2H15M', 135],
		['1:30', 'PT1H30M', 90],
		['1 1/2 hours', 'PT1H30M', 90],
		['1½ hours', 'PT1H30M', 90],
		['1,5 Stunden', 'PT1H30M', 90],
		['3 days', 'PT72H', 4320],
		['1 week', 'PT168H', 10080],
		['90 seconds', 'PT1M30S', 2],
		['25 mn', 'PT25M', 25],
		['an hour', 'PT1H', 60],
		['eine Stunde', 'PT1H', 60],
		['PT1H30M', 'PT1H30M', 90],
		['pt45m', 'PT45M', 45],
		['P1DT2H', 'P1DT2H', 1560]
	])('converts %s to ISO', (input, iso, minutes) => {
		expect(parseRecipeTime(input)).toEqual({ text: iso, minutes, lossless: true })
	})

	it.each([
		['25 to 28 minutes', 28],
		['1-2hrs', 120],
		['55 mins to 1 hr', 60],
		['about 45 minutes', 45],
		['less than 5 minutes', 5],
		['2 à 3 heures', 180],
		['45', 45]
	])('keeps the text of %s but reads %i minutes', (input, minutes) => {
		expect(parseRecipeTime(input)).toEqual({ text: input, minutes, lossless: false })
	})

	it.each([
		'overnight',
		'35 minutes plus overnight soaking',
		'40 mins (plus proving)',
		'10 servings 30 minutes',
		'PT30',
		'PT-491312H47M29S'
	])('keeps %s as text with no minutes', (input) => {
		expect(parseRecipeTime(input)).toEqual({ text: input, minutes: null, lossless: false })
	})

	it('returns nulls for empty values', () => {
		for (const value of [null, undefined, '', '   ']) {
			expect(parseRecipeTime(value)).toEqual({ text: null, minutes: null, lossless: false })
		}
	})

	it.each(['en', 'de', 'it', 'es', 'fr', 'pt', 'ru', 'hi', 'id', 'ar', 'hu', 'cs', 'nl'])(
		'reads back the times it shows in %s',
		(language) => {
			for (const minutes of [1, 2, 5, 21, 45, 60, 95, 120, 150, 1440, 2880, 10080]) {
				const shown = durationToText(minutesToIso(minutes), language)
				expect(parseRecipeTime(shown), `${language}: ${shown}`).toMatchObject({
					minutes,
					lossless: true
				})
			}
		}
	)
})

describe('recipeTimeFields', () => {
	it('normalises all three times', () => {
		expect(
			recipeTimeFields({ prep_time: '20 minutes', cook_time: 'overnight', total_time: '1 hr' })
		).toEqual({
			prep_time: 'PT20M',
			cook_time: 'overnight',
			total_time: 'PT1H',
			prep_minutes: 20,
			cook_minutes: null,
			total_minutes: 60
		})
	})

	it('adds prep and cook when there is no total', () => {
		expect(recipeTimeFields({ prep_time: '20 min', cook_time: '40 min' }).total_minutes).toBe(60)
		expect(recipeTimeFields({ cook_time: '40 min' }).total_minutes).toBe(40)
	})

	it('leaves total empty when a part does not read as a time', () => {
		expect(
			recipeTimeFields({ prep_time: 'overnight', cook_time: '40 min' }).total_minutes
		).toBeNull()
		expect(
			recipeTimeFields({ prep_time: '20 min', total_time: 'a while' }).total_minutes
		).toBeNull()
	})
})

describe('recipeReadyMinutes', () => {
	it('prefers the total, then prep + cook', () => {
		expect(recipeReadyMinutes({ total_minutes: 30, prep_minutes: 50 })).toBe(30)
		expect(recipeReadyMinutes({ prep_minutes: 10, cook_minutes: 20 })).toBe(30)
		expect(recipeReadyMinutes({})).toBeNull()
	})
})

describe('recipe form placeholders', () => {
	it.each(['en', 'de', 'it', 'es', 'fr', 'pt', 'ru', 'hi', 'id', 'ar', 'hu', 'cs', 'nl'])(
		'read as times in %s',
		async (language) => {
			const { recipeForm } = (await import(`$lib/i18n/${language}.js`)).default
			expect(parseRecipeTime(recipeForm.prepTimePlaceholder).minutes).toBe(60)
			expect(parseRecipeTime(recipeForm.cookTimePlaceholder).minutes).toBe(30)
			expect(parseRecipeTime(recipeForm.totalTimePlaceholder).minutes).toBe(90)
		}
	)
})
