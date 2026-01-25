<script>
	import {
		addIngredientToShoppingList,
		deletePurchasedItems,
		deleteShoppingListItem,
		markPurchasedItems,
		updateShoppingListItem
	} from '$lib/utils/crud.js'
	import { ingredientParse } from '$lib/submodules/recipe-ingredient-parser/src/index.js'
	import { sortByTwoKeys } from '$lib/utils/sorting.js'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import ConfirmationDialog from '$lib/components/ui/ConfirmationDialog.svelte'
	import ShoppingToolbar from '$lib/components/shopping/ShoppingToolbar.svelte'
	import ShoppingItemInput from '$lib/components/shopping/ShoppingItemInput.svelte'
	import ShoppingListItem from '$lib/components/shopping/ShoppingListItem.svelte'
	import ShoppingEditDialog from '$lib/components/shopping/ShoppingEditDialog.svelte'
	import InfoText from '$lib/components/ui/InfoText.svelte'

	/** @type {{data: any}} */
	let { data } = $props()

	let { shoppingList } = $state(data)

	let isDeleteDialogOpen = $state(false)
	let isCheckAllDialogOpen = $state(false)
	let shoppingFeedback = $state('')
	let newIngredient = $state('')
	let showHidden = $state(false)
	let isEditDialogOpen = $state(false)
	let sortByPurchased = $state(false)
	let purchaseLoadingByUid = $state({})
	const emptyEditingItem = {
		uid: '',
		name: '',
		quantity: '',
		unit: ''
	}
	let editingItem = $state({ ...emptyEditingItem })

	async function handlePurchaseToggle(item, purchased) {
		purchaseLoadingByUid = { ...purchaseLoadingByUid, [item.uid]: true }
		try {
			const updatedItem = await updateShoppingListItem({ uid: item.uid, purchased })
			shoppingList = shoppingList.map((listItem) => {
				if (listItem.uid === item.uid) {
					return {
						...listItem,
						...updatedItem
					}
				}
				return listItem
			})
		} catch (error) {
			console.error('Error updating shopping list item:', error.message)
		} finally {
			purchaseLoadingByUid = { ...purchaseLoadingByUid, [item.uid]: false }
		}
	}

	async function handleCheckboxChange(item, event) {
		const purchased = event.target.checked
		await handlePurchaseToggle(item, purchased)
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
			const ingredientObject = ingredientParse(newIngredient, 'eng', {
				includeUnitSystems: true,
				includeAlternatives: true
			})

			// Send the object to the API and create a new shopping list item
			const response = await addIngredientToShoppingList(ingredientObject)

			if (response.success) {
				// Successfully added the ingredient to the API
				const newItem = response.data
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

	function togglePurchasedSort() {
		sortByPurchased = !sortByPurchased
	}

	function sortPurchasedByCountThenName(items) {
		return [...items].sort((a, b) => {
			const aCount = a.purchaseCount ?? a.purchaseLogs?.length ?? 0
			const bCount = b.purchaseCount ?? b.purchaseLogs?.length ?? 0
			if (bCount !== aCount) return bCount - aCount
			return (a.name ?? '').localeCompare(b.name ?? '')
		})
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
		event.preventDefault()
		// Validate the edited item's data here (if necessary)

		try {
			// 🔧 Call backend to update item, assign result
			const updatedItem = await updateShoppingListItem(editingItem)

			// Update the item in the local shopping list state if the backend update is successful
			shoppingList = shoppingList.map((item) => {
				if (item.uid === updatedItem.uid) {
					// Preserve purchase counts when the API response omits them
					return { ...item, ...updatedItem }
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
		shoppingFeedback = ''
		try {
			const response = await deleteShoppingListItem(uid)
			if (response.success) {
				// Remove from shopping list
				shoppingList = shoppingList.filter((item) => item.uid !== uid)

				// 🔒 Reset editing item if it's the one deleted
				if (editingItem?.uid === uid) {
					isEditDialogOpen = false
					editingItem = { ...emptyEditingItem }
				}
				shoppingFeedback = 'Item deleted successfully!'
			} else {
				shoppingFeedback = 'Failed to delete the item. Please try again.'
			}
		} catch (error) {
			console.error('Error deleting item:', error)
			shoppingFeedback = 'Failed to delete item. Please try again.'
		}
	}

	let uncheckedItems = $derived(shoppingList.filter((item) => !item.purchased))
	let purchasedItems = $derived(shoppingList.filter((item) => item.purchased))
	let sortedUncheckedItems = $derived(
		sortByPurchased
			? sortPurchasedByCountThenName(uncheckedItems)
			: sortByTwoKeys(uncheckedItems, 'name', 'name', 'asc', 'asc')
	)
	let sortedPurchasedItems = $derived(
		sortByPurchased
			? sortPurchasedByCountThenName(purchasedItems)
			: sortByTwoKeys(purchasedItems, 'name', 'name', 'asc', 'asc')
	)
	let hiddenMatchQuery = $derived(newIngredient.trim().toLowerCase())
	let hiddenMatches = $derived(
		!showHidden && hiddenMatchQuery.length >= 3
			? sortPurchasedByCountThenName(
					shoppingList.filter(
						(item) => item.purchased && item.name?.toLowerCase().includes(hiddenMatchQuery)
					)
				)
			: []
	)
	let purchasedItemCount = $derived(shoppingList.filter((item) => item.purchased).length)
	let uncheckedItemCount = $derived(shoppingList.filter((item) => !item.purchased).length)
</script>

<div class="prose mb-2 max-w-none flex gap-2 justify-center">
	<h2>Shopping</h2>
</div>
<div class="mb-2 max-w-none flex gap-2 justify-center">
	<ShoppingToolbar
		{showHidden}
		{sortByPurchased}
		{uncheckedItemCount}
		{purchasedItemCount}
		onToggleHidden={toggleHidden}
		onTogglePurchasedSort={togglePurchasedSort}
		onCheckAll={() => (isCheckAllDialogOpen = true)}
		onDeletePurchased={() => (isDeleteDialogOpen = true)} />
</div>

<ShoppingItemInput
	bind:value={newIngredient}
	onAdd={handleAddIngredient}
	onKeyPress={handleKeyPressIngredient} />
<div class="list-info">
	{#if shoppingList.length === 0}
		<FeedbackMessage message={'List empty: add some items!'} />
	{/if}
</div>
<FeedbackMessage message={shoppingFeedback} />

{#if sortedUncheckedItems.length > 0}
	<h3 class="mt-2 mb-2">To buy</h3>
{/if}
<ul class="list bg-base-100 rounded-box shadow-md divide-y divide-base-300">
	{#each sortedUncheckedItems as item (item.uid)}
		<ShoppingListItem
			{item}
			onCheckboxChange={handleCheckboxChange}
			onEdit={openEditModal}
			onTogglePurchase={(targetItem) => handlePurchaseToggle(targetItem, !targetItem.purchased)}
			purchaseLoading={purchaseLoadingByUid[item.uid] ?? false} />
	{/each}
</ul>

{#if showHidden}
	<h3 class="mt-4 mb-2">Purchased</h3>
	<InfoText class="my-2">Uncheck to add to shopping list</InfoText>
	<ul class="list bg-base-100 rounded-box shadow-md divide-y divide-base-300">
		{#each sortedPurchasedItems as item (item.uid)}
			<ShoppingListItem
				{item}
				onCheckboxChange={handleCheckboxChange}
				onEdit={openEditModal}
				onTogglePurchase={(targetItem) => handlePurchaseToggle(targetItem, !targetItem.purchased)}
				purchaseLoading={purchaseLoadingByUid[item.uid] ?? false} />
		{/each}
	</ul>
{/if}
{#if hiddenMatches.length > 0}
	<p class="prose text-xs mt-3 mb-2 flex justify-center max-w-none">
		Matches from previously bought items - uncheck to add
	</p>
	<ul class="list bg-base-100 rounded-box shadow-md divide-y divide-base-300">
		{#each hiddenMatches as item (item.uid)}
			<ShoppingListItem
				{item}
				onCheckboxChange={handleCheckboxChange}
				onEdit={openEditModal}
				onTogglePurchase={(targetItem) => handlePurchaseToggle(targetItem, !targetItem.purchased)}
				purchaseLoading={purchaseLoadingByUid[item.uid] ?? false} />
		{/each}
	</ul>
{/if}

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

<ShoppingEditDialog
	bind:isOpen={isEditDialogOpen}
	bind:item={editingItem}
	onSave={handleSaveEdit}
	onDelete={handleDeleteItem} />
