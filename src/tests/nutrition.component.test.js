import '@testing-library/jest-dom'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/svelte/svelte5'
import RecipeViewNutrition from '$lib/components/recipe/RecipeViewNutrition.svelte'

describe('RecipeViewNutrition', () => {
	it('renders a 2-column nutrition table', () => {
		render(RecipeViewNutrition, {
			props: {
				nutritionalInfo: 'Calories: 471 kcal\nFat: 14.1 g',
				scale: 1,
				language: 'eng'
			}
		})

		expect(screen.getByText('Nutrient')).toBeInTheDocument()
		expect(screen.getByText('Amount')).toBeInTheDocument()
		expect(screen.getByText('Calories')).toBeInTheDocument()
		expect(screen.getByText('471 kcal')).toBeInTheDocument()
	})

	it('renders per-serving status when detected', () => {
		render(RecipeViewNutrition, {
			props: {
				nutritionalInfo: 'Per serving\nCalories: 220 kcal',
				scale: 2,
				language: 'eng'
			}
		})

		expect(screen.getByText('Per serving')).toBeInTheDocument()
		expect(screen.getByText('220 kcal')).toBeInTheDocument()
	})

	it('renders Note column when entries include notes', () => {
		render(RecipeViewNutrition, {
			props: {
				nutritionalInfo: 'Calories: 323 kcal 16%\nFat: 12 g 18%',
				scale: 1,
				language: 'eng'
			}
		})

		expect(screen.getByText('Note')).toBeInTheDocument()
		expect(screen.getByText('16%')).toBeInTheDocument()
	})

	it('falls back to raw text when confidence is low', () => {
		render(RecipeViewNutrition, {
			props: {
				nutritionalInfo: 'healthy and delicious',
				scale: 1,
				language: 'eng'
			}
		})

		expect(screen.getByText('healthy and delicious')).toBeInTheDocument()
	})

	it('shows in-view clean button on low-confidence content', async () => {
		const onCleanup = vi.fn()
		render(RecipeViewNutrition, {
			props: {
				nutritionalInfo: 'healthy and delicious',
				scale: 1,
				language: 'eng',
				showCleanupAction: true,
				onCleanup
			}
		})

		const button = screen.getByRole('button', { name: 'Clean Nutrition' })
		expect(button).toBeInTheDocument()
	})
})
