import type { IRecord } from '$lib/types'

// Sort ascending A-Z or 1-9
export function sortByKeyAsc(inputArray: IRecord[], inputKey: string): IRecord[] {
	return inputArray.sort((a, b) => {
		return a[inputKey].toString().localeCompare(b[inputKey].toString())
	})
}

// Sort descending Z-A or 9-1
export function sortByKeyDesc(inputArray: IRecord[], inputKey: string): IRecord[] {
	return inputArray.sort((a, b) => {
		return b[inputKey].toString().localeCompare(a[inputKey].toString())
	})
}

// Function that returns the oldest date first
export function sortByDateDesc(inputArray: IRecord[], dateKey: string): IRecord[] {
	return inputArray.sort((a, b) => {
		return new Date(a[dateKey] as string).getTime() - new Date(b[dateKey] as string).getTime()
	})
}

// Function that returns the newest date first
export function sortByDateAsc(inputArray: IRecord[], dateKey: string): IRecord[] {
	return inputArray.sort((a, b) => {
		return new Date(b[dateKey] as string).getTime() - new Date(a[dateKey] as string).getTime()
	})
}

// Sort array randomly
export function randomSortArray(inputArray: IRecord[]): IRecord[] {
	return inputArray.sort(() => Math.random() - 0.5)
}
