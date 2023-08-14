<script>
	import CategoryEdit from '$lib/components/CategoryEdit.svelte'
	import { wrapTopLevelNodes } from '$lib/utils/categories.js'

	export let data

	let { myNodes } = data

	let nodes = wrapTopLevelNodes(myNodes)

	function sortItemsAlphabetically(nodes) {
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

	// When fetching data
	nodes = sortItemsAlphabetically(nodes)
</script>

<h3>Edit Your Categories</h3>
<CategoryEdit node={nodes.node1} bind:nodes />
