export function sortRecipesByKey(recipes, key, currentSort) {
	const sortByKey = key === 'created' ? sortByDate : sortByKeyGeneric

	if (!currentSort || currentSort === 'desc') {
		return { sortedRecipes: sortByKey(recipes, key, 'asc'), newSort: 'asc' }
	} else {
		return { sortedRecipes: sortByKey(recipes, key, 'desc'), newSort: 'desc' }
	}
}

function sortByKeyGeneric(inputArray, inputKey, direction) {
	console.log('🚀 ~ file: sorting.js:13 ~ sortByKeyGeneric')
	return [...inputArray].sort((a, b) => {
		return direction === 'asc'
			? a[inputKey].toString().localeCompare(b[inputKey].toString())
			: b[inputKey].toString().localeCompare(a[inputKey].toString())
	})
}

function sortByDate(inputArray, dateKey, direction) {
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
