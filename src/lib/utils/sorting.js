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
 * Sorts an array of objects by two keys, with specified sort directions for each key.
 * The array is first sorted by the `primarySortKey` in the specified `primaryDirection`.
 * If two elements have the same value for the `primarySortKey`, they are then sorted
 * by the `secondarySortKey` in the specified `secondaryDirection`.
 *
 * @param {Object[]} inputArray - The array of objects to sort.
 * @param {string} primarySortKey - The key to sort the array by initially.
 * @param {string} secondarySortKey - The key to sort the array by when the primary key values are equal.
 * @param {string} [primaryDirection='asc'] - The sort direction for the primary key ('asc' or 'desc').
 * @param {string} [secondaryDirection='asc'] - The sort direction for the secondary key ('asc' or 'desc').
 * @returns {Object[]} - The array sorted by the specified primary and secondary keys.
 */
export function sortByTwoKeys(
	inputArray,
	primarySortKey,
	secondarySortKey,
	primaryDirection = 'asc',
	secondaryDirection = 'asc'
) {
	// First, sort by the primary key using sortByKeyGeneric
	let sortedArray = sortByKeyGeneric(inputArray, primarySortKey, primaryDirection)

	// Then, within each group of primary key, sort by the secondary key
	return sortedArray.sort((a, b) => {
		// Only compare secondary key if primary keys are equal
		if (a[primarySortKey] === b[primarySortKey]) {
			const aValue = a[secondarySortKey]?.toString().toUpperCase() || ''
			const bValue = b[secondarySortKey]?.toString().toUpperCase() || ''

			if (secondaryDirection === 'asc') {
				return aValue.localeCompare(bValue)
			} else {
				return bValue.localeCompare(aValue)
			}
		}
		return 0 // Keep original order if primary keys are different
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
