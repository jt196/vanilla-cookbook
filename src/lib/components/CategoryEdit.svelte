<script>
	import { flip } from 'svelte/animate'
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action'

	export let nodes = {}
	export let node

	// Sort the items when the node is updated
	$: {
		if (node && node.items) {
			node.items = node.items.filter((item) => nodes[item.uid]) // remove items not in nodes
			node.items.sort((a, b) => {
				const nameA = nodes[a.uid].name.toLowerCase()
				const nameB = nodes[b.uid].name.toLowerCase()
				if (nameA < nameB) return -1
				if (nameA > nameB) return 1
				return 0
			})
		}
	}

	const flipDurationMs = 300
	function handleDndConsider(e) {
		node.items = e.detail.items
	}

	function findParentUID(itemUID, nodes) {
		for (let nodeUID in nodes) {
			const node = nodes[nodeUID]
			if (node.items && node.items.some((item) => item.id === itemUID)) {
				return nodeUID
			}
		}
		return null // No parent found
	}

	function handleDndFinalize(e) {
		console.log(e.detail)
		const movedItemId = e.detail.info.id
		let parentUid = null

		// Check if the moved item is still present in the current list
		const isItemInList = node.items.some((item) => item.uid === movedItemId)

		// If the item is not in the list, it's the source list, so skip the API call
		if (!isItemInList) {
			return
		}

		// Find the parent UID of the moved item
		for (const [nodeId, nodeData] of Object.entries(nodes)) {
			if (nodeData.items && nodeData.items.some((item) => item.uid === movedItemId)) {
				parentUid = nodeId
				break
			}
		}

		// If the parent UID is 'node1', it means the item is at the root level.
		if (parentUid === 'node1') {
			parentUid = null
		}

		const movedItem = {
			uid: movedItemId,
			parent_uid: parentUid
		}

		// Send the update to the server
		fetch('/api/recipe/categories', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(movedItem)
		})

		// Trigger a reactivity update
		node.items = e.detail.items
		nodes = { ...nodes }
	}
</script>

<b>{node.name}</b>
{#if node.hasOwnProperty('items')}
	<section
		use:dndzone={{ items: node.items, flipDurationMs, centreDraggedOnCursor: true }}
		on:consider={handleDndConsider}
		on:finalize={handleDndFinalize}>
		<!-- WE FILTER THE SHADOW PLACEHOLDER THAT WAS ADDED IN VERSION 0.7.4, filtering this way rather than checking whether 'nodes' have the id became possible in version 0.9.1 -->
		{#each node.items.filter((item) => item.uid !== SHADOW_PLACEHOLDER_ITEM_ID) as item (item.uid)}
			<div animate:flip={{ duration: flipDurationMs }} class="item">
				<svelte:self bind:nodes node={nodes[item.uid]} />
			</div>
		{/each}
	</section>
{/if}

<style>
	section {
		width: auto;
		max-width: 400px;
		border: 0px solid black;
		padding: 0.4em;
		/* this will allow the dragged element to scroll the list */
		overflow-y: auto;
		height: auto;
		background-color: rgba(100, 100, 100, 0.1);
	}
	div {
		width: 90%;
		padding: 0.3em;
		border: 0px solid blue;
		margin: 0.15em 0;
	}
	.item {
		background-color: rgba(00, 100, 100, 0.1);
	}
</style>
