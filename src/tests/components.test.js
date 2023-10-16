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
	const mockSortState = { key: 'created', direction: 'desc' }

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

	it('dispatches sort event with correct key on date button click', async () => {
		const { getByText, component } = render(RecipeFilter, { sortState: mockSortState })
		const dateButton = getByText('Date')

		let dispatchedEvent = null
		component.$on('sort', (event) => {
			dispatchedEvent = event
		})

		await fireEvent.click(dateButton)
		expect(dispatchedEvent.detail.key).toBe('created')
	})

	it('dispatches sort event with correct key on title button click', async () => {
		const { getByText, component } = render(RecipeFilter, { sortState: mockSortState })
		const titleButton = getByText('Title')

		let dispatchedEvent = null
		component.$on('sort', (event) => {
			dispatchedEvent = event
		})

		await fireEvent.click(titleButton)
		expect(dispatchedEvent.detail.key).toBe('name')
	})

	// Add similar tests for other buttons and behaviors as needed
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

	it('displays the FoodBowl component if the recipe does not have a valid image_url', () => {
		const { getByAltText } = render(RecipeList, {
			useVirtualList: false,
			filteredRecipes: mockRecipes,
			data: mockData
		})

		expect(() => getByAltText('Recipe B thumbnail')).toThrow()
	})

	it('displays the recipe name and creation date', () => {
		const { getAllByText } = render(RecipeList, {
			useVirtualList: false,
			filteredRecipes: mockRecipes,
			data: mockData
		})

		// Check for the "Created:" text for each recipe
		const createdElements = getAllByText(/Created:/i)
		expect(createdElements.length).toBe(mockRecipes.length)
	})

	it('displays the "Delete" and "Edit" buttons only if the recipe.userId matches data.user.userId', () => {
		// Destructure getByTestId, getByText, and queryByText from render
		const { getByTestId, getByText, queryByText } = render(RecipeList, {
			useVirtualList: false,
			filteredRecipes: mockRecipes,
			data: mockData
		})

		// Check for Recipe A (userId matches)
		expect(getByTestId('delete-button')).toBeInTheDocument()
		expect(getByTestId('edit-button')).toBeInTheDocument()

		// Check for Recipe B (userId does not match)
		const recipeBElement = getByText('Recipe B')
		expect(recipeBElement).toBeInTheDocument()

		// Ensure the buttons are not present within the context of Recipe B
		const parentArticle = recipeBElement.closest('article')
		expect(parentArticle.contains(queryByText('Delete'))).toBeFalsy()
		expect(parentArticle.contains(queryByText('Edit'))).toBeFalsy()
	})
})
