<script>
	import CategoryEdit from './CategoryEdit.svelte';

	import { flip } from 'svelte/animate'
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action'
	import Ellipsis from './svg/Ellipsis.svelte'

	/** @type {{nodes?: any, node: any}} */
	let { nodes = $bindable({}), node = $bindable() } = $props();

	// Sort the items when the node is updated
	$effect(() => {
		if (node && node.items) {
			// Create a new sorted list instead of modifying `node.items` directly
			const sortedItems = node.items
				.filter((item) => nodes[item.uid]) // remove items not in nodes
				.sort((a, b) => {
					const nameA = nodes[a.uid].name.toLowerCase();
					const nameB = nodes[b.uid].name.toLowerCase();
					return nameA.localeCompare(nameB);
				});

			// Only assign if it actually changes to prevent reactivity loops
			if (JSON.stringify(sortedItems) !== JSON.stringify(node.items)) {
				node.items = sortedItems;
			}
		}
	});

	const flipDurationMs = 300
	function handleDndConsider(e) {
		node.items = e.detail.items
	}

	let editingId = $state(null)
	let editedName = $state('')

	function startEditing(uid, name) {
		editingId = uid
		editedName = name
	}

	async function saveChanges(uid) {
		if (editedName && nodes[uid].name !== editedName) {
			try {
				const response = await fetch(`/api/recipe/categories/${uid}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ uid: uid, name: editedName })
				})

				if (!response.ok) {
					const errorData = await response.json()
					throw new Error(errorData.message || 'Error updating category name')
				}

				nodes[uid].name = editedName // Update the local state
				nodes = { ...nodes } // Trigger reactivity
			} catch (error) {
				console.error('Error updating category name:', error.message)
			}
		}
		editingId = null
	}

	async function deleteCategory(uid) {
		if (!confirm('Are you sure you want to delete this category?')) {
			return
		}
		try {
			const response = await fetch(`/api/recipe/categories/${uid}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Error deleting category')
			}

			// Remove the category from the local state or refresh the list
			delete nodes[uid]
			nodes = { ...nodes } // Trigger reactivity
		} catch (error) {
			console.error('Error deleting category:', error.message)
		}
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

<div class="category-container">
	<b>
		{#if editingId === node.uid}
			<input
				bind:value={editedName}
				onblur={() => saveChanges(node.uid)}
				onkeydown={(e) => e.key === 'Enter' && saveChanges(node.uid)} />
			<button onclick={() => (editingId = null)}>Cancel</button>
			<button onclick={() => saveChanges(node.uid)}>Save</button>
			<button onclick={() => deleteCategory(node.uid)}>Delete</button>
		{:else}
			{node.name}
		{/if}
	</b>
	<button onclick={() => startEditing(node.uid, node.name)}
		><Ellipsis width="20px" fill="var(--pico-secondary)" /></button>
</div>

<section
	use:dndzone={{ items: node.items || [], flipDurationMs, centreDraggedOnCursor: true }}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}>
	{#if node.items}
		{#each node.items.filter((item) => item.uid !== SHADOW_PLACEHOLDER_ITEM_ID) as item (item.uid)}
			<div animate:flip={{ duration: flipDurationMs }} class="item">
				<CategoryEdit bind:nodes node={nodes[item.uid]} />
			</div>
		{/each}
	{/if}
</section>

<style lang="scss">
	section {
		width: auto;
		max-width: 400px;
		border: 0px solid black;
		padding: 0.4em;
		margin: 0.4rem;
		/* this will allow the dragged element to scroll the list */
		overflow-y: auto;
		height: auto;
		background-color: rgba(100, 100, 100, 0.1);
	}

	.category-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		button {
			padding: 0.2rem;
			background-color: var(--pico-contrast-focus);
			border: none;
		}
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
