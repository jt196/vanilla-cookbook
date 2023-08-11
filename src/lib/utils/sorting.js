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
export function sortByDateAsc(inputArray, dateKey) {
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
export function sortByDateDesc(inputArray, dateKey) {
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

/**
 * Sorts recipe array by Date
 *
 * @param {Recipe[]} recipes - An array of recipes to sort
 * @param {string} currentSort - The key by which to sort.
 */
export function sortRecipesByDate(recipes, currentSort) {
	if (!currentSort || currentSort === 'desc') {
		return { sortedRecipes: sortByDateAsc(recipes, 'created'), newSort: 'asc' }
	} else {
		return { sortedRecipes: sortByDateDesc(recipes, 'created'), newSort: 'desc' }
	}
}

/**
 * Sorts recipe array by Title
 *
 * @param {Recipe[]} recipes - An array of recipes to sort
 * @param {string} currentSort - The key by which to sort.
 */
export function sortRecipesByTitle(recipes, currentSort) {
	if (!currentSort || currentSort === 'desc') {
		return { sortedRecipes: sortByKeyAsc(recipes, 'name'), newSort: 'asc' }
	} else {
		return { sortedRecipes: sortByKeyDesc(recipes, 'name'), newSort: 'desc' }
	}
}
