/**
 * GitHub-style Markdown editing helpers for textareas:
 * - Enter on a list item continues the list (`- `, `* `, `1. ` → `2. `, `- [ ] `)
 * - Enter on an empty list item ends the list
 * - ⌘/Ctrl+B and ⌘/Ctrl+I toggle **bold** and _italic_ (plain Markdown, no HTML)
 *
 * The edit logic is pure (see `listContinuation`, `wrapSelection`) so it can be tested
 * without a browser; `markdownEditing` is the Svelte action that applies it.
 *
 * @module markdownEditing
 */

/**
 * @typedef {Object} TextEdit
 * @property {number} start - Replace from here...
 * @property {number} end - ...to here
 * @property {string} text - with this text
 * @property {number} selectStart - Selection afterwards
 * @property {number} selectEnd
 */

// indent, marker (bullet or number + . or )), optional task box, space(s), content
const LIST_ITEM = /^(\s*)([-*+]|(\d+)([.)]))( \[[ xX]\])?(\s+)(.*)$/

/**
 * The edit for pressing Enter at `cursor`, or null to let Enter behave normally.
 *
 * @param {string} value
 * @param {number} cursor
 * @returns {TextEdit | null}
 */
export function listContinuation(value, cursor) {
	const lineStart = value.lastIndexOf('\n', cursor - 1) + 1
	const lineEnd = value.indexOf('\n', cursor) === -1 ? value.length : value.indexOf('\n', cursor)
	const match = value.slice(lineStart, cursor).match(LIST_ITEM)
	if (!match) return null

	const [, indent, bullet, number, delimiter, task, spacing, content] = match
	const restOfLine = value.slice(cursor, lineEnd)

	// Empty item: Enter removes the marker and ends the list
	if (!content.trim() && !restOfLine.trim()) {
		return {
			start: lineStart,
			end: lineEnd,
			text: '',
			selectStart: lineStart,
			selectEnd: lineStart
		}
	}

	const marker = number ? `${Number(number) + 1}${delimiter}` : bullet
	const text = `\n${indent}${marker}${task ? ' [ ]' : ''}${spacing}`
	const caret = cursor + text.length
	return { start: cursor, end: cursor, text, selectStart: caret, selectEnd: caret }
}

/**
 * The edit for toggling a Markdown token (e.g. `**`) around the selection. If the selection
 * is already wrapped, the wrapper is removed. With no selection, an empty pair is inserted
 * with the cursor between.
 *
 * @param {string} value
 * @param {number} start
 * @param {number} end
 * @param {string} token - e.g. `**`
 * @returns {TextEdit}
 */
export function wrapSelection(value, start, end, token) {
	const selected = value.slice(start, end)
	const wrapped =
		value.slice(start - token.length, start) === token &&
		value.slice(end, end + token.length) === token
	if (wrapped && selected) {
		const outer = start - token.length
		return {
			start: outer,
			end: end + token.length,
			text: selected,
			selectStart: outer,
			selectEnd: outer + selected.length
		}
	}
	const inner = start + token.length
	return {
		start,
		end,
		text: `${token}${selected}${token}`,
		selectStart: inner,
		selectEnd: inner + selected.length
	}
}

/**
 * Apply an edit through the browser's editing stack when possible, so ⌘Z undoes it as one
 * step; otherwise splice the value directly. Either way an `input` event fires, which keeps
 * Svelte's `bind:value` in sync.
 *
 * @param {HTMLTextAreaElement} textarea
 * @param {TextEdit} edit
 */
function applyEdit(textarea, edit) {
	textarea.setSelectionRange(edit.start, edit.end)
	const inserted =
		typeof document.execCommand === 'function' &&
		(edit.text
			? document.execCommand('insertText', false, edit.text)
			: document.execCommand('delete', false))
	if (!inserted) {
		textarea.setRangeText(edit.text, edit.start, edit.end, 'end')
		textarea.dispatchEvent(new Event('input', { bubbles: true }))
	}
	textarea.setSelectionRange(edit.selectStart, edit.selectEnd)
}

const WRAP_KEYS = { b: '**', i: '_' }

/**
 * Svelte action adding GitHub-style Markdown editing to a textarea.
 *
 * @param {HTMLTextAreaElement} textarea
 */
export function markdownEditing(textarea) {
	/** @param {KeyboardEvent} event */
	function onKeydown(event) {
		if (event.isComposing) return
		const { value, selectionStart: start, selectionEnd: end } = textarea

		let edit = null
		const modifier = event.metaKey || event.ctrlKey
		if (event.key === 'Enter' && !modifier && !event.shiftKey && !event.altKey && start === end) {
			edit = listContinuation(value, start)
		} else if (modifier && !event.altKey && !event.shiftKey) {
			const token = WRAP_KEYS[event.key.toLowerCase()]
			if (token) edit = wrapSelection(value, start, end, token)
		}

		if (!edit) return
		event.preventDefault()
		applyEdit(textarea, edit)
	}

	textarea.addEventListener('keydown', onKeydown)
	return { destroy: () => textarea.removeEventListener('keydown', onKeydown) }
}
