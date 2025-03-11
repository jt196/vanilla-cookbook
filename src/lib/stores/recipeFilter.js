import { writable } from 'svelte/store'

export const sortState = writable({
	key: 'created',
	direction: 'asc'
})

export const searchString = writable('')
export const searchKey = writable('name')
export const cookedFilter = writable(false)
export const favouriteFilter = writable(false)
