<script>
	import CategoryEdit from '$lib/components/CategoryEdit.svelte'
	import { wrapTopLevelNodes } from '$lib/utils/categories.js'

	export let data

	let { myNodes } = data

	let nodes = wrapTopLevelNodes(myNodes)
</script>

<h3>Edit Your Categories</h3>
<CategoryEdit node={nodes.node1} bind:nodes />
