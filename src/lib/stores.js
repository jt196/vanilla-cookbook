import { writable } from 'svelte/store'

export const sortState = writable({
	key: 'created',
	direction: 'asc'
})

export const searchString = writable('')
export const searchKey = writable('name')
