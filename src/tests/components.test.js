// NOTE: jest-dom adds handy assertions to Jest and it is recommended, but not required.
import '@testing-library/jest-dom'

import { render, fireEvent, screen } from '@testing-library/svelte'

import Scale from '$lib/components/Scale.svelte'
import RecipeFilter from '$lib/components/RecipeFilter.svelte'
import RecipeList from '$lib/components/RecipeList.svelte'

/* global expect, it, describe */

describe('Scale component', () => {
	it('should increase the scale value correctly', async () => {
		render(Scale)

		const plusButton = screen.getByText('+')
		const input = screen.getByDisplayValue('1')

		// Increase from 1 to 1.5
		await fireEvent.click(plusButton)
		expect(input.value).toBe('1.5')

		// Increase from 1.5 to 2
		await fireEvent.click(plusButton)
		expect(input.value).toBe('2')

		// Clear the input and set value to 5
		input.value = '5'
		await fireEvent.input(input)
		await fireEvent.click(plusButton)
		expect(input.value).toBe('6')
	})

	it('should decrease the scale value correctly', async () => {
		render(Scale)

		const minusButton = screen.getByText('-')
		const input = screen.getByDisplayValue('1')

		// Initial value
		expect(input.value).toBe('1')

		// Decrease from 1 to 0.5
		await fireEvent.click(minusButton)
		expect(input.value).toBe('0.5')

		// Set value to 2 and decrease to 1.5
		await fireEvent.input(input, { target: { value: '2' } })
		await fireEvent.click(minusButton)
		expect(input.value).toBe('1.5')

		// Set value to 6 and decrease to 5
		await fireEvent.input(input, { target: { value: '6' } })
		await fireEvent.click(minusButton)
		expect(input.value).toBe('5')
	})
})

describe('RecipeFilter component', () => {
	const mockSortDate = () => {}
	const mockSortTitle = () => {}

	it('renders without crashing', () => {
		const { getByPlaceholderText } = render(RecipeFilter, {
			sortDate: mockSortDate,
			sortTitle: mockSortTitle
		})
		expect(getByPlaceholderText('Search my recipes')).toBeInTheDocument()
	})

	it('binds search input correctly', async () => {
		const { getByPlaceholderText } = render(RecipeFilter, {
			sortDate: mockSortDate,
			sortTitle: mockSortTitle
		})
		const input = getByPlaceholderText('Search my recipes')

		await fireEvent.input(input, { target: { value: 'test' } })
		expect(input.value).toBe('test')
	})

	it('highlights the correct button based on activeButton prop', () => {
		const { getByText } = render(RecipeFilter, {
			activeButton: 'date',
			sortDate: mockSortDate,
			sortTitle: mockSortTitle
		})
		const dateButton = getByText('Date')
		expect(dateButton).toHaveClass('secondary')
	})

	it('triggers sortDate function on date button click', async () => {
		let wasCalled = false
		const sortDateMock = () => {
			wasCalled = true
		}
		const { getByText } = render(RecipeFilter, { sortDate: sortDateMock, sortTitle: mockSortTitle })
		const dateButton = getByText('Date')

		await fireEvent.click(dateButton)
		expect(wasCalled).toBe(true)
	})

	it('triggers sortTitle function on title button click', async () => {
		let wasCalled = false
		const sortTitleMock = () => {
			wasCalled = true
		}
		const { getByText } = render(RecipeFilter, { sortDate: mockSortDate, sortTitle: sortTitleMock })
		const titleButton = getByText('Title')

		await fireEvent.click(titleButton)
		expect(wasCalled).toBe(true)
	})
})

describe('RecipeList component', () => {
	const mockRecipes = [
		{
			name: 'Recipe A',
			created: new Date('2022-01-01'),
			image_url: 'http://example.com/imageA.jpg',
			userId: 1,
			uid: 'A'
		},
		{ name: 'Recipe B', created: new Date('2022-01-02'), userId: 2, uid: 'B' }
	]
	const mockData = { user: { userId: 1 } }

	it('renders without crashing', () => {
		const { container } = render(RecipeList, { filteredRecipes: mockRecipes, data: mockData })
		expect(container).toBeInTheDocument()
	})

	it('renders the correct number of recipes', () => {
		const { getAllByRole } = render(RecipeList, { filteredRecipes: mockRecipes, data: mockData })
		const articles = getAllByRole('article')
		expect(articles.length).toBe(mockRecipes.length)
	})

	it('displays an image if the recipe has a valid image_url', () => {
		const { getByAltText } = render(RecipeList, { filteredRecipes: mockRecipes, data: mockData })
		const image = getByAltText('Recipe A thumbnail')
		expect(image).toBeInTheDocument()
		expect(image.src).toBe('http://example.com/imageA.jpg')
	})

	it('displays the FoodBowl component if the recipe does not have a valid image_url', () => {
		const { getByAltText } = render(RecipeList, { filteredRecipes: mockRecipes, data: mockData })
		expect(() => getByAltText('Recipe B thumbnail')).toThrow()
	})

	it('displays the recipe name and creation date', () => {
		const { getAllByText } = render(RecipeList, { filteredRecipes: mockRecipes, data: mockData })

		// Check for the "Created:" text for each recipe
		const createdElements = getAllByText(/Created:/i)
		expect(createdElements.length).toBe(mockRecipes.length)
	})

	it('displays the "Delete", "Edit", and "View" buttons only if the recipe.userId matches data.user.userId', () => {
		const { getByText, queryByText } = render(RecipeList, {
			filteredRecipes: mockRecipes,
			data: mockData
		})

		// Check for Recipe A (userId matches)
		expect(getByText('Delete')).toBeInTheDocument()
		expect(getByText('Edit')).toBeInTheDocument()
		expect(getByText('View')).toBeInTheDocument()

		// Check for Recipe B (userId does not match)
		const recipeBElement = getByText('Recipe B')
		expect(recipeBElement).toBeInTheDocument()

		// Ensure the buttons are not present within the context of Recipe B
		const parentArticle = recipeBElement.closest('article')
		expect(parentArticle.contains(queryByText('Delete'))).toBeFalsy()
		expect(parentArticle.contains(queryByText('Edit'))).toBeFalsy()
		expect(parentArticle.contains(queryByText('View'))).toBeFalsy()
	})
})
