import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listContinuation, markdownEditing, wrapSelection } from '$lib/utils/markdownEditing'

/** Apply a TextEdit to a string, returning the new value and selection for easy asserts. */
function apply(value, edit) {
	return {
		value: value.slice(0, edit.start) + edit.text + value.slice(edit.end),
		selection: [edit.selectStart, edit.selectEnd]
	}
}
/** Press Enter at the end of `value`. */
const enterAtEnd = (value) => {
	const edit = listContinuation(value, value.length)
	return edit && apply(value, edit).value
}

describe('listContinuation', () => {
	it.each([
		['- flour', '- flour\n- '],
		['* flour', '* flour\n* '],
		['+ flour', '+ flour\n+ '],
		['1. Mix', '1. Mix\n2. '],
		['9) Bake', '9) Bake\n10) '],
		['  - nested', '  - nested\n  - '],
		['- [x] done', '- [x] done\n- [ ] '],
		['Step one\n3. Fold', 'Step one\n3. Fold\n4. ']
	])('continues %j', (value, expected) => {
		expect(enterAtEnd(value)).toBe(expected)
	})

	it('puts the cursor after the new marker', () => {
		const edit = listContinuation('1. Mix', 6)
		expect(apply('1. Mix', edit).selection).toEqual([10, 10])
	})

	it('ends the list when Enter is pressed on an empty item', () => {
		expect(enterAtEnd('- flour\n- ')).toBe('- flour\n')
		expect(enterAtEnd('1. Mix\n2. ')).toBe('1. Mix\n')
		expect(enterAtEnd('- [ ] ')).toBe('')
	})

	it('splits an item when Enter is pressed mid-line', () => {
		const value = '- salt and pepper'
		const edit = listContinuation(value, 7) // after "- salt "
		expect(apply(value, edit).value).toBe('- salt \n- and pepper')
	})

	it.each(['Mix well', '', '-not a list', '1.not a list', '**bold**'])(
		'leaves Enter alone on %j',
		(value) => {
			expect(listContinuation(value, value.length)).toBeNull()
		}
	)
})

describe('wrapSelection', () => {
	it('wraps the selection and keeps it selected', () => {
		const result = apply('Fold gently', wrapSelection('Fold gently', 5, 11, '**'))
		expect(result).toEqual({ value: 'Fold **gently**', selection: [7, 13] })
	})

	it('inserts an empty pair with the cursor inside when nothing is selected', () => {
		expect(apply('Fold ', wrapSelection('Fold ', 5, 5, '_'))).toEqual({
			value: 'Fold __',
			selection: [6, 6]
		})
	})

	it('toggles off an existing wrapper around the selection', () => {
		const value = 'Fold **gently**'
		expect(apply(value, wrapSelection(value, 7, 13, '**'))).toEqual({
			value: 'Fold gently',
			selection: [5, 11]
		})
		const italic = '_gently_'
		expect(apply(italic, wrapSelection(italic, 1, 7, '_')).value).toBe('gently')
	})
})

describe('markdownEditing action', () => {
	let textarea, onInput

	beforeEach(() => {
		textarea = document.createElement('textarea')
		document.body.appendChild(textarea)
		onInput = vi.fn()
		textarea.addEventListener('input', onInput)
		markdownEditing(textarea)
	})

	const press = (key, init = {}) => {
		const event = new KeyboardEvent('keydown', { key, cancelable: true, ...init })
		textarea.dispatchEvent(event)
		return event
	}

	it('continues a list on Enter and fires input for bind:value', () => {
		textarea.value = '1. Mix'
		textarea.setSelectionRange(6, 6)
		const event = press('Enter')
		expect(event.defaultPrevented).toBe(true)
		expect(textarea.value).toBe('1. Mix\n2. ')
		expect(textarea.selectionStart).toBe(10)
		expect(onInput).toHaveBeenCalled()
	})

	it('bolds with Ctrl+B and italicises with Meta+I', () => {
		textarea.value = 'gently'
		textarea.setSelectionRange(0, 6)
		press('b', { ctrlKey: true })
		expect(textarea.value).toBe('**gently**')

		textarea.value = 'gently'
		textarea.setSelectionRange(0, 6)
		press('i', { metaKey: true })
		expect(textarea.value).toBe('_gently_')
	})

	it('leaves other keys, Shift+Enter and plain text alone', () => {
		textarea.value = '- flour'
		textarea.setSelectionRange(7, 7)
		expect(press('Enter', { shiftKey: true }).defaultPrevented).toBe(false)
		expect(press('a').defaultPrevented).toBe(false)
		expect(press('k', { metaKey: true }).defaultPrevented).toBe(false)
		expect(press('u', { metaKey: true }).defaultPrevented).toBe(false)

		textarea.value = 'Mix well'
		textarea.setSelectionRange(8, 8)
		expect(press('Enter').defaultPrevented).toBe(false)
		expect(textarea.value).toBe('Mix well')
	})
})
