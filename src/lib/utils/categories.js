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

// Return the data structure expected for svelte-dnd-action
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

// Wrap all top level nodes in an outer one
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
