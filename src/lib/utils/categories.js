/**
 * Builds a hierarchical structure from a flat list of categories.
 * This is used for taking a user's categories and building a structure from them
 * They're stored in a flat structure in the DB
 *
 * @param {Array} categories - An array of category objects with uid, parent_uid, and other properties.
 * @returns {Array} An array of root categories, each with a nested structure of children.
 */
export function buildHierarchy(categories) {
	const map = {}
	categories.forEach((cat) => (map[cat.uid] = { ...cat, children: [] }))

	const roots = []
	categories.forEach((cat) => {
		if (cat.parent_uid) {
			map[cat.parent_uid].children.push(map[cat.uid])
		} else {
			roots.push(map[cat.uid])
		}
	})

	return roots
}

/**
 * Transforms a hierarchical category structure into a format suitable for svelte-dnd-action.
 *
 * @param {Array} categories - An array of hierarchical category objects.
 * @returns {Object} An object of nodes, each representing a category.
 */
export function transformToNodes(categories) {
	const nodes = {}

	function processCategory(category) {
		nodes[category.uid] = {
			uid: category.uid,
			name: category.name || '_unnamed'
			// add other properties if needed
		}

		// Only add items if there are children
		if (category.children && category.children.length > 0) {
			nodes[category.uid].items = category.children.map((child) => ({ uid: child.uid }))

			// Recursively process children
			category.children.forEach(processCategory)
		}
	}

	// Start processing from the top-level categories
	categories.forEach(processCategory)

	// Now, sort nodes based on their names
	const sortedNodes = Object.values(nodes).sort((a, b) => {
		if (a.name === '_unnamed') return -1
		if (b.name === '_unnamed') return 1
		return a.name.localeCompare(b.name)
	})

	// Convert sorted array back to an object
	const sortedNodesObject = {}
	sortedNodes.forEach((node) => {
		sortedNodesObject[node.uid] = node
	})

	return sortedNodesObject
}

/**
 * Wraps all top-level nodes in an outer node.
 *
 * @param {Object} data - An object of nodes, each representing a category.
 * @returns {Object} The input data with all top-level nodes wrapped in an outer node.
 */
export function wrapTopLevelNodes(data) {
	// First, identify the top-level nodes
	const childUIDs = new Set()
	Object.values(data).forEach((node) => {
		if (node.items) {
			node.items.forEach((item) => childUIDs.add(item.uid))
		}
	})

	const topLevelUIDs = Object.keys(data).filter((uid) => !childUIDs.has(uid))

	// Now, create the new structure
	const wrappedData = {
		node1: {
			uid: 'node1',
			name: 'categories',
			items: topLevelUIDs.map((uid) => ({ uid }))
		},
		...data
	}

	return wrappedData
}

/**
 * Fetches categories for a user and transforms them into a suitable format.
 *
 * @param {Function} fetch - The fetch function to use.
 * @param {URL} url - The base URL to fetch from.
 * @param {string} userId - The ID of the user whose categories to fetch.
 * @returns {Promise<Object>} An object of nodes, each representing a category.
 */
export async function fetchAndTransformCategories(fetch, url, userId) {
	console.log('Fetching categories!')
	const catRes = await fetch(`${url.origin}/api/recipe/categories/user/${userId}`)
	const categories = await catRes.json()
	let nodes = transformToNodes(categories)
	nodes = wrapTopLevelNodes(nodes)
	return sortItemsAlphabetically(nodes)
}

/**
 * Sorts the items in each node alphabetically by name.
 *
 * @param {Object} nodes - An object of nodes, each representing a category.
 * @returns {Object} The input nodes with items sorted alphabetically.
 */
export function sortItemsAlphabetically(nodes) {
	for (let nodeId in nodes) {
		if (nodes[nodeId].items) {
			nodes[nodeId].items.sort((a, b) => {
				const nameA = nodes[a.uid].name ? nodes[a.uid].name.toUpperCase() : ''
				const nameB = nodes[b.uid].name ? nodes[b.uid].name.toUpperCase() : ''
				return nameA.localeCompare(nameB)
			})
		}
	}
	return nodes
}

/**
 * Collects the UIDs of all selected categories from a hierarchical structure.
 *
 * @param {Array} categories - An array of hierarchical category objects.
 * @returns {Array<string>} An array of UIDs of selected categories.
 */
export function collectSelectedUids(categories) {
	const selectedUids = []

	function traverse(category) {
		if (category.selected) {
			selectedUids.push(category.uid)
		}
		if (category.children) {
			category.children.forEach(traverse)
		}
	}

	categories.forEach(traverse)

	return selectedUids
}
