<script>
	import CategoryEdit from '$lib/components/CategoryEdit.svelte'
	import { fetchAndTransformCategories } from '$lib/utils/categories.js'
	import { browser } from '$app/environment'

	/** @type {{data: any}} */
	let { data } = $props();

	let { nodes, userId } = $state(data)

	let newCategoryName = $state('')
	let showNewCategoryInput = $state(false)

	async function addNewCategory() {
		try {
			const response = await fetch('/api/recipe/categories', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: newCategoryName })
			})

			if (response.ok) {
				// Reset the input and hide it
				newCategoryName = ''
				showNewCategoryInput = false

				// Refresh your categories data here to show the new category
				if (browser) {
					nodes = await fetchAndTransformCategories(fetch, window.location, userId)
					nodes = { ...nodes }
				}
			} else {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Error adding new category')
			}
		} catch (error) {
			console.error('Error adding new category:', error.message)
		}
	}
</script>

<button onclick={() => (showNewCategoryInput = !showNewCategoryInput)}>Add New Category</button>

{#if showNewCategoryInput}
	<div>
		<input bind:value={newCategoryName} placeholder="New Category Name" />
		<button onclick={() => (showNewCategoryInput = false)}>Cancel</button>
		<button onclick={addNewCategory}>Save</button>
	</div>
{/if}

<h3>Edit Your Categories</h3>
<CategoryEdit node={nodes.node1} bind:nodes />
