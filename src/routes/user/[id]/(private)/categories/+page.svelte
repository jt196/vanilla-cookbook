<script>
	import CategoryEdit from '$lib/components/CategoryEdit.svelte'
	import { fetchAndTransformCategories } from '$lib/utils/categories.js'
	import { browser } from '$app/environment'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	/** @type {{data: any}} */
	let { data } = $props()

	let { nodes, user } = $state(data)

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
					nodes = await fetchAndTransformCategories(fetch, window.location, user.userId)
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

<Button onclick={() => (showNewCategoryInput = !showNewCategoryInput)}>Add New Category</Button>

{#if showNewCategoryInput}
	<div>
		<Input bind:value={newCategoryName} placeholder="New Category Name" />
		<Button onclick={() => (showNewCategoryInput = false)}>Cancel</Button>
		<Button onclick={addNewCategory}>Save</Button>
	</div>
{/if}

<h3>Edit Your Categories</h3>
<CategoryEdit node={nodes.node1} bind:nodes />
