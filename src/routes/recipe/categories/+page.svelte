<script>
	import CategoryEdit from '$lib/components/CategoryEdit.svelte'
	import {
		wrapTopLevelNodes,
		fetchAndTransformCategories,
		sortItemsAlphabetically
	} from '$lib/utils/categories.js'
	import { browser } from '$app/environment'

	export let data

	let { myNodes } = data

	let newCategoryName = ''
	let showNewCategoryInput = false

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
					myNodes = await fetchAndTransformCategories(fetch, window.location)
					nodes = wrapTopLevelNodes(myNodes)
					nodes = sortItemsAlphabetically(nodes)
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

	let nodes = wrapTopLevelNodes(myNodes)

	// When fetching data
	nodes = sortItemsAlphabetically(nodes)
</script>

<button on:click={() => (showNewCategoryInput = !showNewCategoryInput)}>Add New Category</button>

{#if showNewCategoryInput}
	<div>
		<input bind:value={newCategoryName} placeholder="New Category Name" />
		<button on:click={() => (showNewCategoryInput = false)}>Cancel</button>
		<button on:click={addNewCategory}>Save</button>
	</div>
{/if}

<h3>Edit Your Categories</h3>
<CategoryEdit node={nodes.node1} bind:nodes />
