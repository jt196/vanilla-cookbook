<script>
	import {
		addIngredientToShoppingList,
		deletePurchasedItems,
		deleteShoppingListItem,
		markPurchasedItems,
		updateShoppingListItem
	} from '$lib/utils/crud.js'
	import { parse } from '$lib/submodules/recipe-ingredient-parser/src/index.js'
	import Link from '$lib/components/svg/Link.svelte'
	import { browser } from '$app/environment'
	import { fade } from 'svelte/transition'
	import { onMount, onDestroy } from 'svelte'
	import { sortByTwoKeys } from '$lib/utils/sorting.js'
	import View from '$lib/components/svg/View.svelte'
	import ViewNo from '$lib/components/svg/ViewNo.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import New from '$lib/components/svg/New.svelte'
	import CheckAll from '$lib/components/svg/CheckAll.svelte'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import Edit from '$lib/components/svg/Edit.svelte'
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte'

	/** @type {{data: any}} */
	let { data } = $props()

	let { shoppingList } = $state(data)

	let isDeleteDialogOpen = $state(false)
	let isCheckAllDialogOpen = $state(false)
	let shoppingFeedback = $state('')
	let newIngredient = $state('')
	let showHidden = $state(false)
	let editDialog = $state() // Reference to the edit modal dialog
	let isEditDialogOpen = $state(false) // State to track if the edit modal is open
	let editingItem = $state({}) // The item currently being edited

	async function handleCheckboxChange(item, event) {
		const purchased = event.target.checked
		await updateShoppingListItem({ uid: item.uid, purchased })

		// Update local state to reflect the change
		setTimeout(() => {
			const updatedList = shoppingList.map((listItem) => {
				if (listItem.uid === item.uid) {
					// If the item is unchecked (purchased is false), also set hidden to false
					// Otherwise, just update the purchased status
					return purchased ? { ...listItem, purchased } : { ...listItem, purchased }
				}
				return listItem
			})

			shoppingList = updatedList
		}, 300)
	}

	// Escape to close the edit dialog

	onMount(() => {
		if (browser) {
			document.addEventListener('keydown', handleKeydown)
		}
	})

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('keydown', handleKeydown)
		}
	})

	function handleKeydown(event) {
		if (event.key === 'Escape' && isEditDialogOpen === true) {
			isEditDialogOpen = false
		}
	}

	async function handleDelete() {
		shoppingFeedback = ''
		try {
			// Filter out purchased items from the local data
			shoppingList = shoppingList.filter((item) => !item.purchased)
			const response = await deletePurchasedItems()
			if (response.success) {
				shoppingFeedback = 'Successfully deleted purchased items!'
			} else {
				shoppingFeedback = 'There was a problem deleting purchased items!'
			}
		} catch (error) {
			console.error('Error deleting purchased items:', error.message)
			shoppingFeedback = 'There was a problem deleting purchased items!'
		}
		isDeleteDialogOpen = false
	}

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
				shoppingList = [...shoppingList, newItem] // Add the new item to the local state
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

	function toggleHidden() {
		showHidden = !showHidden
	}

	async function handleCheckAll() {
		shoppingFeedback = '' // Reset or clear the feedback message before starting the updates
		try {
			const result = await markPurchasedItems() // Call the bulk update function

			if (result && result.updatedCount > 0) {
				// If items were successfully updated, reflect these changes locally
				shoppingList = shoppingList.map((item) => ({ ...item, purchased: true }))
				shoppingFeedback = `${result.updatedCount} item(s) have been marked as purchased!` // Inform the user about the number of items updated
			} else if (result && result.updatedCount === 0) {
				// If no items were updated, inform the user accordingly
				shoppingFeedback = 'No items needed to be marked as purchased.'
			} else {
				// Handle unexpected outcomes
				shoppingFeedback = 'An unexpected error occurred while updating items.'
			}
		} catch (error) {
			shoppingFeedback = 'An error occurred while updating items.' // Set an error message for catch block errors
			console.error('Error updating shopping list items:', error.message)
		}
		isCheckAllDialogOpen = false
	}

	function openEditModal(item) {
		editingItem = { ...item } // Create a shallow copy to edit
		isEditDialogOpen = true
	}

	// Function to handle saving the edited item
	async function handleSaveEdit(event) {
		console.log('🚀 ~ handleSaveEdit ~ event:', event)
		event.preventDefault()
		// Validate the edited item's data here (if necessary)

		try {
			// Update the item on the backend
			const updatedItem = await updateShoppingListItem(editingItem)
			console.log('🚀 ~ handleSaveEdit ~ updatedItem:', updatedItem)

			// Update the item in the local shopping list state if the backend update is successful
			shoppingList = shoppingList.map((item) => {
				if (item.uid === updatedItem.uid) {
					// Replace the old item data with the updated item data
					return updatedItem
				}
				return item
			})

			isEditDialogOpen = false // Close the edit modal
			shoppingFeedback = 'Item updated successfully!' // Optional: Show success feedback
		} catch (error) {
			console.error('Error updating item:', error)
			shoppingFeedback = 'Failed to update item. Please try again.'
		}
	}

	async function handleDeleteItem(uid) {
		try {
			// Update the item on the backend
			const response = await deleteShoppingListItem(uid)
			if (response.success) {
				shoppingList = shoppingList.filter((item) => item.uid !== uid)

				shoppingFeedback = 'Item deleted successfully!'
			} else {
				// Handle cases where the backend response is not successful
				shoppingFeedback = 'Failed to delete the item. Please try again.'
			}
		} catch (error) {
			console.error('Error deleting item:', error)
			shoppingFeedback = 'Failed to delete item. Please try again.'
		}
	}

	let sortedList = $derived(
		showHidden
			? sortByTwoKeys(shoppingList, 'purchased', 'name', 'asc', 'asc')
			: sortByTwoKeys(
					shoppingList.filter((item) => !item.purchased),
					'name',
					'asc'
				)
	)
	let purchasedItemCount = $derived(shoppingList.filter((item) => item.purchased).length)
	let uncheckedItemCount = $derived(shoppingList.filter((item) => !item.purchased).length)
</script>

<h4>Shopping List</h4>

<div class="shopping-buttons">
	<button
		onclick={toggleHidden}
		data-tooltip={showHidden ? 'Show Unpurchased Items' : 'Show Purchased Items'}>
		{#if showHidden}
			<View width="20px" height="20px" fill="white" />
		{:else}
			<ViewNo width="20px" height="20px" fill="white" />
		{/if}
	</button>

	<button
		disabled={uncheckedItemCount === 0}
		onclick={() => (isCheckAllDialogOpen = true)}
		data-tooltip="Mark all items as purchased">
		<CheckAll width="20px" height="20px" fill="white" />
	</button>

	<button
		disabled={purchasedItemCount === 0}
		onclick={() => (isDeleteDialogOpen = true)}
		data-tooltip="Delete all purchased items">
		<Delete width="20px" height="20px" fill="white" />
	</button>
</div>
<div class="add-ingredient">
	<input
		type="text"
		placeholder="Enter ingredient..."
		bind:value={newIngredient}
		onkeydown={handleKeyPressIngredient} />
	<button onclick={handleAddIngredient}>
		<!-- You can include your New.Svelte component here for styling -->
		<New width="20px" fill="white" />
	</button>
</div>
<div class="list-info">
	{#if shoppingList.length === 0}
		<FeedbackMessage message={'List empty: add some items!'} />
	{:else if shoppingList.every((item) => item.purchased) && !showHidden}
		<FeedbackMessage message={'List empty: all items are marked as purchased!'} />
	{/if}
</div>
<FeedbackMessage message={shoppingFeedback} />
<fieldset>
	{#each sortedList as item (item.uid)}
		{#if !item.purchased || showHidden}
			<div class="list-item" out:fade={{ duration: 300 }}>
				<div class="item-qty-unit">
					<div class="item-label">
						<label class:checked={item.purchased}>
							<input
								type="checkbox"
								name={item.name}
								checked={item.purchased}
								onchange={(event) => handleCheckboxChange(item, event)} />
							<p class="item-name">
								{item.name}
							</p>
							<div class="unit-quantity">
								{#if item.quantity}
									<span>{item.quantity}</span>
								{/if}
								{#if item.unit}
									<span>{item.unit}</span>
								{/if}
							</div>
							{#if item.recipeUid}
								<a
									href="/recipe/{item.recipeUid}/view"
									data-tooltip={item.recipe.name ? item.recipe.name : ''}>
									<Link width="20px" fill="var(--pico-muted-color)" />
								</a>
							{/if}
						</label>
					</div>
				</div>
				<div class="item-buttons">
					<button class="outline contrast" id="edit-item" onclick={() => openEditModal(item)}
						><Edit width="20px" height="20px" fill="var(--pico-ins-color)" /></button>
				</div>
			</div>
		{/if}
	{/each}
</fieldset>

<ConfirmationDialog
	isOpen={isDeleteDialogOpen}
	onConfirm={handleDelete}
	onClose={() => (isDeleteDialogOpen = false)}>
	{#snippet content()}
		<div>
			<h2>Delete Your Purchased Items?</h2>
			<p>This will permanently delete all purchased items from your shopping list.</p>
		</div>
	{/snippet}
</ConfirmationDialog>

<ConfirmationDialog
	isOpen={isCheckAllDialogOpen}
	onConfirm={handleCheckAll}
	onClose={() => (isCheckAllDialogOpen = false)}>
	{#snippet content()}
		<div>
			<h2>Check all items as purchased?</h2>
			<p>This will mark all your shopping as purchased.</p>
		</div>
	{/snippet}
</ConfirmationDialog>

<dialog this={editDialog} open={isEditDialogOpen}>
	<form onsubmit={handleSaveEdit}>
		<label for="edit-name">Name:</label>
		<input id="edit-name" type="text" bind:value={editingItem.name} />

		<label for="edit-quantity">Quantity:</label>
		<input id="edit-quantity" type="number" bind:value={editingItem.quantity} />

		<label for="edit-unit">Unit:</label>
		<input id="edit-unit" type="text" bind:value={editingItem.unit} />

		<footer>
			<button type="button" onclick={() => (isEditDialogOpen = false)}>Cancel</button>
			<button
				class="outline secondary"
				id="delete-item"
				onclick={() => handleDeleteItem(editingItem.uid)}
				><Delete width="15px" height="15px" fill="var(--pico-del-color)" /></button>
			<button type="submit">Save</button>
		</footer>
	</form>
</dialog>

<style lang="scss">
	.checked {
		color: var(--pico-muted-color);
	}
	.shopping-buttons {
		margin-bottom: 1rem;
	}

	form > footer {
		display: flex;
		gap: 0.5rem;
		justify-content: space-between; /* Ensures even spacing */
		button {
			flex: 1; /* Makes buttons take equal width */
		}

		#delete-item {
			flex: 0 1 35px; /* Ensures it doesn't expand but can shrink */
			padding: 0 0.5rem;
			max-height: 35px;
		}
	}
	.list-item {
		display: flex;
		border-bottom: 0.5px solid var(--pico-primary-focus);
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0;
		@media (max-width: 767px) {
			padding: 0;
			#delete-item {
				display: none;
			}
		}
		.item-qty-unit {
			display: flex;
			flex-direction: column;
		}
		.item-label label {
			display: flex;
			align-items: center;
			gap: 0.3rem;
			margin: 0;
			justify-content: center;
			max-width: 100%;
			.item-name {
				flex: 1 1 auto;
				min-width: 0;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
				margin: 0;
				padding: 0;
			}
		}
		.item-buttons {
			margin-left: auto;
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			@media (max-width: 767px) {
				display: flex;
				flex-direction: column;
				gap: 0.2rem;
				padding: 0.2rem 0;
				.outline {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					height: 40px;
					padding: 0 10px;
				}

				/* Optional: Adjust SVG size if necessary */
				.outline svg {
					width: 20px;
					height: 20px;
				}
			}
		}
	}

	.unit-quantity,
	.recipe-name {
		margin: 0;
		padding: 0 0.5rem;
		color: var(--pico-muted-color);
	}
	.recipe-name {
		font-weight: lighter;
	}
	.empty-space {
		display: inline-block; /* Makes it occupy space */
		width: 20px; /* Adjust the width as needed */
		height: 1em; /* Adjust the height as needed */
	}
	.hidden {
		visibility: hidden;
	}

	.add-ingredient {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		input {
			margin-bottom: 0;
			min-height: 40px;
		}
	}
</style>
