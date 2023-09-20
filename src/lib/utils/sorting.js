/**
 * Sorts an array of recipes by a given key.
 * @param {Object[]} recipes - Array of recipes to sort.
 * @param {string} key - The key by which to sort the recipes.
 * @param {string} [currentSort] - The current sort direction ('asc' or 'desc').
 * @returns {{sortedRecipes: Object[], newSort: string}} - An object containing the sorted recipes and the new sort direction.
 */
export function sortRecipesByKey(recipes, key, currentSort) {
	const sortByKey = key === 'created' ? sortByDate : sortByKeyGeneric

	if (!currentSort || currentSort === 'desc') {
		return { sortedRecipes: sortByKey(recipes, key, 'asc'), newSort: 'asc' }
	} else {
		return { sortedRecipes: sortByKey(recipes, key, 'desc'), newSort: 'desc' }
	}
}

/**
 * Sorts an array by a given key in either ascending or descending order.
 * @param {Object[]} inputArray - Array of objects to sort.
 * @param {string} inputKey - The key by which to sort the array.
 * @param {string} direction - The sort direction ('asc' or 'desc').
 * @returns {Object[]} - The sorted array.
 */
export function sortByKeyGeneric(inputArray, inputKey, direction) {
	return [...inputArray].sort((a, b) => {
		const aValue = a[inputKey]?.toString() || '' // Use optional chaining and fallback to empty string
		const bValue = b[inputKey]?.toString() || '' // Use optional chaining and fallback to empty string

		return direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
	})
}

/**
 * Sorts an array by a date key in either ascending or descending order.
 * @param {Object[]} inputArray - Array of objects to sort.
 * @param {string} dateKey - The date key by which to sort the array.
 * @param {string} direction - The sort direction ('asc' or 'desc').
 * @returns {Object[]} - The sorted array.
 */
export function sortByDate(inputArray, dateKey, direction) {
	return [...inputArray].sort((a, b) => {
		return direction === 'asc'
			? new Date(a[dateKey]).getTime() - new Date(b[dateKey]).getTime()
			: new Date(b[dateKey]).getTime() - new Date(a[dateKey]).getTime()
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
 * Recursively sorts an array of objects by their 'name' property.
 * @param {Object[]} data - Array of objects to sort.
 * @returns {Object[]} - The sorted array.
 */
export function sortByNameRecursive(data) {
	// Sort the current level by name
	data.sort((a, b) => {
		if (a.name && b.name) {
			return a.name.localeCompare(b.name)
		} else if (a.name) {
			return -1
		} else if (b.name) {
			return 1
		} else {
			return 0
		}
	})

	// Recursively sort children
	for (let item of data) {
		if (item.children && item.children.length) {
			sortByNameRecursive(item.children)
		}
	}

	return data
}
