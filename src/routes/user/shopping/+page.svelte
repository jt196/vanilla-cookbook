<script>
	import {
		addIngredientToShoppingList,
		hidePurchasedItems,
		updateShoppingListItem
	} from '$lib/utils/crud.js'
	import { parse } from '$lib/submodules/recipe-ingredient-parser/src/index.js'
	import Link from '$lib/components/svg/Link.svelte'
	import { fade } from 'svelte/transition'
	import { onMount } from 'svelte'
	import { sortByTwoKeys } from '$lib/utils/sorting.js'
	import View from '$lib/components/svg/View.svelte'
	import ViewNo from '$lib/components/svg/ViewNo.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import New from '$lib/components/svg/New.svelte'
	import CheckAll from '$lib/components/svg/CheckAll.svelte'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'

	export let data

	async function handleCheckboxChange(item, event) {
		const purchased = event.target.checked
		await updateShoppingListItem({ uid: item.uid, purchased })

		// Update local state to reflect the change
		setTimeout(() => {
			const updatedList = data.shoppingList.map((listItem) => {
				if (listItem.uid === item.uid) {
					// If the item is unchecked (purchased is false), also set hidden to false
					// Otherwise, just update the purchased status
					return purchased ? { ...listItem, purchased } : { ...listItem, purchased }
				}
				return listItem
			})

			data.shoppingList = updatedList
		}, 300)
	}

	onMount(() => {
		deleteDialog.addEventListener('close', () => {
			isDeleteDialogOpen = false
		})
		document.addEventListener('keydown', handleKeydown)
		return () => {
			// Cleanup when the component is destroyed
			document.removeEventListener('keydown', handleKeydown)
		}
	})

	function handleKeydown(event) {
		if (event.key === 'Escape' && isDeleteDialogOpen) {
			isDeleteDialogOpen = false
		}
	}

	let deleteDialog
	let isDeleteDialogOpen = false

	async function handleDelete() {
		try {
			// Filter out purchased items from the local data
			data.shoppingList = data.shoppingList.filter((item) => !item.purchased)
			isDeleteDialogOpen = false
			await hidePurchasedItems() // Call your API to update the database
		} catch (error) {
			console.error('Error deleting purchased items:', error.message)
			// Handle the error (e.g., show an error message to the user)
		}
	}

	let shoppingFeedback = ''

	let newIngredient = ''

	async function handleAddIngredient() {
		try {
			const ingredientObject = parse(newIngredient, 'eng')

			// Send the object to the API and create a new shopping list item
			const response = await addIngredientToShoppingList(ingredientObject)
			console.log('🚀 ~ handleAddIngredient ~ response:', response)

			if (response.success) {
				// Successfully added the ingredient to the API
				const newItem = response.data
				console.log('🚀 ~ handleAddIngredient ~ newItem:', newItem)
				data.shoppingList = [...data.shoppingList, newItem] // Add the new item to the local state
				newIngredient = '' // Clear the input field
			} else {
				// Handle errors or show an error message to the user
				console.error('Error adding ingredient:', response.statusText)
			}
		} catch (error) {
			console.error('Error adding ingredient:', error.message)
			// Handle network errors or other exceptions
		}
	}

	function handleKeyPressIngredient(event) {
		if (event.key === 'Enter') {
			// If Enter key is pressed, add the ingredient
			handleAddIngredient()
		}
	}

	let showHidden = false

	function toggleHidden() {
		showHidden = !showHidden
	}

	async function checkAll() {
		shoppingFeedback = '' // Reset or clear the feedback message before starting the updates

		try {
			const updatePromises = data.shoppingList.map((item) =>
				updateShoppingListItem({ uid: item.uid, purchased: true }).then(() => ({
					...item,
					purchased: true
				}))
			)

			const updatedItems = await Promise.all(updatePromises)
			data.shoppingList = updatedItems // Update the local state with the updated items

			shoppingFeedback = 'All items have been marked as purchased!' // Set a success message
		} catch (error) {
			shoppingFeedback = 'An error occurred while updating items.' // Set an error message
			console.error('Error updating shopping list items:', error.message)
		}
	}

	$: sortedList = showHidden
		? sortByTwoKeys(data.shoppingList, 'purchased', 'name', 'asc', 'asc')
		: sortByTwoKeys(
				data.shoppingList.filter((item) => !item.purchased),
				'name',
				'asc'
		  )
</script>

<h4>Shopping List</h4>

<div class="shopping-buttons">
	<button on:click={toggleHidden}>
		{#if showHidden}
			<View width="20px" fill="white" />
		{:else}
			<ViewNo width="20px" fill="white" />
		{/if}
	</button>

	<button on:click={() => (isDeleteDialogOpen = true)}>
		<Delete width="20px" fill="white" />
	</button>

	<button on:click={checkAll}>
		<CheckAll width="20px" fill="white" />
	</button>
</div>
<div class="add-ingredient">
	<input
		type="text"
		placeholder="Enter ingredient..."
		bind:value={newIngredient}
		on:keydown={handleKeyPressIngredient} />
	<button on:click={handleAddIngredient}>
		<!-- You can include your New.Svelte component here for styling -->
		<New width="20px" fill="white" />
	</button>
</div>
<div class="list-info">
	{#if data.shoppingList.length === 0}
		<FeedbackMessage message={'List empty: add some items!'} />
	{:else if data.shoppingList.every((item) => item.purchased) && !showHidden}
		<FeedbackMessage message={'List empty: all items are marked as purchased!'} />
	{/if}
</div>
<FeedbackMessage message={shoppingFeedback} />
<fieldset>
	{#each sortedList as item (item.uid)}
		{#if !item.purchased || showHidden}
			<div class="list-item" out:fade={{ duration: 300 }}>
				<div class={`unit-quantity ${showHidden ? '' : 'hidden'}`}>
					{#if item.quantity}
						<span>{item.quantity}</span>
					{/if}
					{#if item.unit}
						<span>{item.unit}</span>
					{/if}
				</div>
				<label class:checked={item.purchased}>
					<input
						type="checkbox"
						name={item.name}
						checked={item.purchased}
						on:change={(event) => handleCheckboxChange(item, event)} />
					{item.name}
					{#if item.recipeUid}
						<a href="/recipe/{item.recipeUid}/view"
							><Link width="20px" fill="var(--pico-primary)" /></a>
					{/if}
				</label>
			</div>
		{/if}
	{/each}
</fieldset>

<dialog bind:this={deleteDialog} open={isDeleteDialogOpen}>
	<article>
		<h2>Delete Your purchased items?</h2>
		<p>This will permanently delete all purchased items from your shopping list.</p>
		<footer>
			<button class="secondary" on:click={() => (isDeleteDialogOpen = false)}>Cancel</button>
			<button on:click={handleDelete}>Confirm</button>
		</footer>
	</article>
</dialog>

<style lang="scss">
	.checked {
		color: var(--pico-muted-color);
	}
	.shopping-buttons {
		margin-bottom: 1rem;
	}
	label {
		font-size: 2rem;
	}
	.unit-quantity {
		font-size: 0.8rem;
		margin: 0;
		padding: 12px 0 0 44px;

		color: var(--pico-muted-color);
	}
	.hidden {
		visibility: hidden;
	}

	.add-ingredient {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
		input {
			margin-bottom: 0;
		}
	}

	.list-item {
		border-bottom: 0.5px solid var(--pico-primary-focus);
	}
</style>
