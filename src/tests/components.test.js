// NOTE: jest-dom adds handy assertions to Jest and it is recommended, but not required.
import '@testing-library/jest-dom'

import { render, fireEvent, screen } from '@testing-library/svelte'

import TestComponent from '../lib/components/TestComponent.svelte'
import Scale from '../lib/components/Scale.svelte'

/* global test, expect */

test('shows proper heading when rendered', () => {
	render(TestComponent, { name: 'World' })
	const heading = screen.getByText('Hello World!')
	expect(heading).toBeInTheDocument()
})

// Note: This is as an async test as we are using `fireEvent`
test('changes button text on click', async () => {
	render(TestComponent, { name: 'World' })
	const button = screen.getByRole('button')

	// Using await when firing events is unique to the svelte testing library because
	// we have to wait for the next `tick` so that Svelte flushes all pending state changes.
	await fireEvent.click(button)

	expect(button).toHaveTextContent('Button Clicked')
})

test('should increase the scale value correctly', async () => {
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

test('should decrease the scale value correctly', async () => {
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
