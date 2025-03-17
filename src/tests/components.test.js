// NOTE: jest-dom adds handy assertions to Jest and it is recommended, but not required.
import '@testing-library/jest-dom'
import { sortState } from '$lib/stores/recipeFilter'
import { get } from 'svelte/store'

import { render, fireEvent, screen } from '@testing-library/svelte/svelte5'

import Scale from '$lib/components/Scale.svelte'
import RecipeFilter from '$lib/components/RecipeFilter.svelte'
import RecipeList from '$lib/components/RecipeList.svelte'

/* global expect, it, describe, beforeEach */

describe('Scale component', () => {
	it('should increase the scale value correctly', async () => {
		const mockChange = vi.fn()
		const { component } = render(Scale, { props: { scale: 1, onScaleChange: mockChange } })

		const plusButton = screen.getByText('+')

		// Increase from 1 to 1.5
		await fireEvent.click(plusButton)
		expect(mockChange).toHaveBeenLastCalledWith(1.5)

		// Simulate parent updating scale to 1.5
		// @ts-expect-deprecated - $set is fine in tests despite deprecation notice
		component.$set({ scale: 1.5 })

		// Increase from 1.5 to 2
		await fireEvent.click(plusButton)
		expect(mockChange).toHaveBeenLastCalledWith(2)

		component.$set({ scale: 5 })

		// Set to 5, increase to 6
		await fireEvent.click(plusButton)
		expect(mockChange).toHaveBeenLastCalledWith(6)
	})

	it('should decrease the scale value correctly', async () => {
		const mockChange = vi.fn()
		const { component } = render(Scale, { props: { scale: 1, onScaleChange: mockChange } })

		const minusButton = screen.getByText('-')

		// Decrease from 1 to 0.5
		await fireEvent.click(minusButton)
		expect(mockChange).toHaveBeenLastCalledWith(0.5)

		component.$set({ scale: 2 })

		// Decrease from 2 to 1.5
		await fireEvent.click(minusButton)
		expect(mockChange).toHaveBeenLastCalledWith(1.5)

		component.$set({ scale: 6 })

		// Decrease from 6 to 5
		await fireEvent.click(minusButton)
		expect(mockChange).toHaveBeenLastCalledWith(5)
	})
})

describe('RecipeFilter component', () => {
	const mockSortState = { key: 'created', direction: 'desc' }

	beforeEach(() => {
		// Reset sortState to a default value before each test
		sortState.set({ key: 'created', direction: 'desc' })
	})

	it('renders without crashing', () => {
		const { getByPlaceholderText } = render(RecipeFilter, { sortState: mockSortState })
		expect(getByPlaceholderText('Search my recipes by...')).toBeInTheDocument()
	})

	it('binds search input correctly', async () => {
		const { getByPlaceholderText } = render(RecipeFilter, { sortState: mockSortState })
		const input = getByPlaceholderText('Search my recipes by...')

		await fireEvent.input(input, { target: { value: 'test' } })
		expect(input.value).toBe('test')
	})

	it('binds search dropdown correctly', async () => {
		const { getByLabelText } = render(RecipeFilter, { sortState: mockSortState })
		const dropdown = getByLabelText('selections')

		await fireEvent.select(dropdown, { target: { value: 'ingredients' } })
		expect(dropdown.value).toBe('ingredients')
	})

	it('defaults to "name" in the search dropdown', () => {
		const { getByLabelText } = render(RecipeFilter, { sortState: mockSortState })
		const dropdown = getByLabelText('selections')
		expect(dropdown.value).toBe('name')
	})

	it('updates dropdown value correctly on name selection', async () => {
		const { getByLabelText } = render(RecipeFilter, { sortState: mockSortState })
		const dropdown = getByLabelText('selections')

		await fireEvent.select(dropdown, { target: { value: 'name' } })

		expect(dropdown.value).toBe('name')
	})

	it('updates dropdown value correctly on ingredients selection', async () => {
		const { getByLabelText } = render(RecipeFilter, { sortState: mockSortState })
		const dropdown = getByLabelText('selections')

		await fireEvent.select(dropdown, { target: { value: 'ingredients' } })

		expect(dropdown.value).toBe('ingredients')
	})

	it('highlights the correct button based on activeButton prop', () => {
		const { getByText } = render(RecipeFilter, {
			activeButton: 'created',
			sortState: mockSortState
		})
		const dateButton = getByText('Date')
		expect(dateButton).toHaveClass('secondary')
	})

	it('updates sort state correctly on date button click', async () => {
		// Render your component
		const { getByText } = render(RecipeFilter)

		// Find the button by its text
		const dateButton = getByText('Date')

		// Click the 'Date' button
		await fireEvent.click(dateButton)

		// Get the current value of the sortState store
		const updatedSortState = get(sortState)

		// Check if the sortState store has been updated correctly
		expect(updatedSortState).toEqual({ key: 'created', direction: 'asc' })
	})

	it('updates sort state correctly on title button click', async () => {
		// Render your component
		const { getByText } = render(RecipeFilter)

		// Find the button by its text
		const titleButton = getByText('Title')

		// Click the 'Title' button
		await fireEvent.click(titleButton)

		// Get the current value of the sortState store
		const updatedSortState = get(sortState)

		// Check if the sortState store has been updated correctly
		expect(updatedSortState).toEqual({ key: 'name', direction: 'asc' }) // or 'desc', depending on your implementation
	})
})

describe('RecipeList component', () => {
	const mockRecipes = [
		{
			name: 'Recipe A',
			created: new Date('2022-01-01'),
			image_url: 'http://example.com/imageA.jpg',
			userId: 1,
			uid: 'A',
			photos: [
				{
					id: '!test',
					fileType: 'jpg'
				}
			]
		},
		{ name: 'Recipe B', created: new Date('2022-01-02'), userId: 2, uid: 'B' }
	]
	const mockData = { user: { requestedUserId: 1 } }

	it('renders without crashing', () => {
		const { container } = render(RecipeList, {
			useVirtualList: false,
			filteredRecipes: mockRecipes,
			data: mockData
		})
		expect(container).toBeInTheDocument()
	})

	it('renders the correct number of recipes', () => {
		const { getAllByRole } = render(RecipeList, {
			useVirtualList: false,
			filteredRecipes: mockRecipes,
			data: mockData
		})

		const articles = getAllByRole('article')
		expect(articles.length).toBe(mockRecipes.length)
	})

	it('displays an image if the recipe has a valid image_url', () => {
		const { getByAltText } = render(RecipeList, {
			useVirtualList: false,
			filteredRecipes: mockRecipes,
			data: mockData
		})

		const image = getByAltText('Recipe A thumbnail')
		expect(image).toBeInTheDocument()

		// Assuming that the id of the photo for "Recipe A" is known and is stored in a variable called photoId
		const photoId = mockRecipes[0].photos[0].id // or however you get the id from the mock
		expect(image.src).toContain(`/api/recipe/image/${photoId}`)
	})
})
