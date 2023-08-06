import type { IStringDateRecord } from '$lib/types'

// Sort ascending A-Z or 1-9
export function sortByKeyAsc(
	inputArray: IStringDateRecord[],
	inputKey: string
): IStringDateRecord[] {
	return inputArray.sort((a, b) => {
		return a[inputKey].toString().localeCompare(b[inputKey].toString())
	})
}

// Sort descending Z-A or 9-1
export function sortByKeyDesc(
	inputArray: IStringDateRecord[],
	inputKey: string
): IStringDateRecord[] {
	return inputArray.sort((a, b) => {
		return b[inputKey].toString().localeCompare(a[inputKey].toString())
	})
}

// Function that returns the oldest date first
export function sortByDateDesc(
	inputArray: IStringDateRecord[],
	dateKey: string
): IStringDateRecord[] {
	return inputArray.sort((a, b) => {
		return new Date(a[dateKey] as string).getTime() - new Date(b[dateKey] as string).getTime()
	})
}

// Function that returns the newest date first
export function sortByDateAsc(
	inputArray: IStringDateRecord[],
	dateKey: string
): IStringDateRecord[] {
	return inputArray.sort((a, b) => {
		return new Date(b[dateKey] as string).getTime() - new Date(a[dateKey] as string).getTime()
	})
}

// Sort array randomly
export function randomSortArray(inputArray: IStringDateRecord[]): IStringDateRecord[] {
	return inputArray.sort(() => Math.random() - 0.5)
}
