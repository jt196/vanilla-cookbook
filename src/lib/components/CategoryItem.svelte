<script>
	import CategoryItem from '$lib/components/CategoryItem.svelte'

	/** @type {{node: any, nodes: any}} */
	let { node = $bindable(), nodes = $bindable() } = $props();

	let isEditing = $state(false)
	let editedName = $state(node.name)

	async function saveChanges() {
		if (editedName !== node.name) {
			try {
				const response = await fetch(`/api/recipe/categories/${node.uid}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ uid: node.uid, name: editedName })
				})

				if (!response.ok) {
					const errorData = await response.json()
					throw new Error(errorData.message || 'Error updating category name')
				}

				node.name = editedName // Update the local state
				node = node
			} catch (error) {
				console.error('Error updating category name:', error.message)
			}
		}
		isEditing = false
	}
</script>

{#if isEditing}
	<input
		bind:value={editedName}
		onblur={saveChanges}
		onkeydown={(e) => e.key === 'Enter' && saveChanges()} />
	<button onclick={() => (isEditing = false)}>Cancel</button>
	<button onclick={saveChanges}>Save</button>
{:else}
	<span>{node.name}</span>
	<button onclick={() => (isEditing = true)}>Edit</button>
{/if}

{#if node.hasOwnProperty('items')}
	<section>
		{#each node.items as item}
			{console.log('Item UID:', item.uid)}
			{console.log('Nodes:', nodes)}
			<CategoryItem bind:nodes node={nodes?.[item.uid]} />
		{/each}
	</section>
{/if}
