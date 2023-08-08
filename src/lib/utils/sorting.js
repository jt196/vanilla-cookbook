/**
 * Sorts the input array by a specific key in ascending order.
 *
 * @param {stringDateRecord[]} inputArray - Array of records to sort.
 * @param {string} inputKey - The key by which to sort.
 * @returns {stringDateRecord[]} - Sorted array.
 */
export function sortByKeyAsc(inputArray, inputKey) {
	return inputArray.sort((a, b) => {
		return a[inputKey].toString().localeCompare(b[inputKey].toString())
	})
}

/**
 * Sorts the input array by a specific key in descending order.
 *
 * @param {stringDateRecord[]} inputArray - Array of records to sort.
 * @param {string} inputKey - The key by which to sort.
 * @returns {stringDateRecord[]} - Sorted array.
 */
export function sortByKeyDesc(inputArray, inputKey) {
	return inputArray.sort((a, b) => {
		return b[inputKey].toString().localeCompare(a[inputKey].toString())
	})
}

/**
 * Sorts the input array by date in descending order.
 *
 * @param {stringDateRecord[]} inputArray - Array of records to sort.
 * @param {string} dateKey - The key by which to sort.
 * @returns {stringDateRecord[]} - Sorted array.
 */
export function sortByDateDesc(inputArray, dateKey) {
	return inputArray.sort((a, b) => {
		return new Date(a[dateKey]).getTime() - new Date(b[dateKey]).getTime()
	})
}

/**
 * Sorts the input array by date in ascending order.
 *
 * @param {stringDateRecord[]} inputArray - Array of records to sort.
 * @param {string} dateKey - The key by which to sort.
 * @returns {stringDateRecord[]} - Sorted array.
 */
export function sortByDateAsc(inputArray, dateKey) {
	return inputArray.sort((a, b) => {
		return new Date(b[dateKey]).getTime() - new Date(a[dateKey]).getTime()
	})
}

/**
 * Sorts the input array randomly.
 *
 * @param {stringDateRecord[]} inputArray - Array of records to sort.
 * @returns {stringDateRecord[]} - Randomly sorted array.
 */
export function randomSortArray(inputArray) {
	return inputArray.sort(() => Math.random() - 0.5)
}
