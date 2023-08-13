<script>
	import CategoryEdit from '$lib/components/CategoryEdit.svelte'
	import { wrapTopLevelNodes } from '$lib/utils/categories.js'

	export let data

	let { myNodes } = data

	let nodes = wrapTopLevelNodes(myNodes)
	console.log('🚀 ~ file: +page.svelte:10 ~ nodes:', nodes)
</script>

<h3>Try dragging node2 into node3 and then node4 into node2</h3>
<!-- <CategoryEdit node={nodes.node1} bind:nodes /> -->
<h3>Testing Categories</h3>
<CategoryEdit node={nodes.node1} bind:nodes />
