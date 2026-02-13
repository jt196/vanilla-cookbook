import { writable } from 'svelte/store'

export const sortState = writable({
	key: null,
	direction: null
})

export const searchString = writable('')
export const searchFields = writable([])
export const cookedFilter = writable(false)
export const favouriteFilter = writable(false)
