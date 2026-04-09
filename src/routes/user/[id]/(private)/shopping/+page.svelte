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
	import InfoText from '$lib/components/ui/InfoText.svelte'
	import ShoppingToolbar from '$lib/components/shopping/ShoppingToolbar.svelte'
	import ShoppingItemInput from '$lib/components/shopping/ShoppingItemInput.svelte'
	import ShoppingListItem from '$lib/components/shopping/ShoppingListItem.svelte'
	import ShoppingEditDialog from '$lib/components/shopping/ShoppingEditDialog.svelte'
	import { t } from '$lib/stores/locale.js'

	/** @type {{data: any}} */
	let { data } = $props()

	let { shoppingList } = $state(data)

	let isDeleteDialogOpen = $state(false)
	let isCheckAllDialogOpen = $state(false)
	let shoppingFeedback = $state('')
	let shoppingFeedbackCode = $state(null)
	let shoppingFeedbackVars = $state({})
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
		shoppingFeedbackCode = null
		shoppingFeedbackVars = {}
		try {
			const response = await deletePurchasedItems()
			if (response.success) {
				shoppingList = shoppingList.filter((item) => !item.purchased)
				shoppingFeedback = ''
				shoppingFeedbackCode = 'shopping.msg.deletedPurchased'
				shoppingFeedbackVars = {}
			} else {
				shoppingFeedback = response.error || ''
				shoppingFeedbackCode = response.code || 'shopping.msg.deletedPurchasedFail'
			}
		} catch (error) {
			console.error('Error deleting purchased items:', error.message)
			shoppingFeedback = error.message || ''
			shoppingFeedbackCode = error.code || 'shopping.msg.deletedPurchasedFail'
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
				shoppingFeedback = ''
				shoppingFeedbackCode = response.data?.code || 'shopping.msg.itemAdded'
				shoppingFeedbackVars = {}
			} else {
				console.error('Error adding ingredient:', response.error)
				shoppingFeedback = response.error || ''
				shoppingFeedbackCode = response.code || 'shopping.msg.itemAddFail'
			}
		} catch (error) {
			console.error('Error adding ingredient:', error.message)
			shoppingFeedback = error.message || ''
			shoppingFeedbackCode = error.code || 'shopping.msg.itemAddFail'
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
		shoppingFeedbackCode = null
		shoppingFeedbackVars = {}
		try {
			const result = await markPurchasedItems() // Call the bulk update function

			if (result && result.updatedCount > 0) {
				// If items were successfully updated, reflect these changes locally
				shoppingList = shoppingList.map((item) => ({ ...item, purchased: true }))
				shoppingFeedback = ''
				shoppingFeedbackCode =
					result.code ||
					(result.updatedCount === 1
						? 'shopping.msg.markedPurchased_one'
						: 'shopping.msg.markedPurchased_other')
				shoppingFeedbackVars = result.vars || { count: result.updatedCount }
			} else if (result && result.updatedCount === 0) {
				shoppingFeedback = ''
				shoppingFeedbackCode = result.code || 'shopping.msg.noneToMark'
			} else {
				shoppingFeedback = result?.error || ''
				shoppingFeedbackCode = result?.code || 'shopping.msg.updateError'
			}
		} catch (error) {
			shoppingFeedback = error.message || ''
			shoppingFeedbackCode = error.code || 'shopping.msg.updateErrorGeneric'
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
			shoppingFeedback = ''
			shoppingFeedbackCode = updatedItem?.code || 'shopping.msg.itemUpdated'
			shoppingFeedbackVars = updatedItem?.vars || {}
		} catch (error) {
			console.error('Error updating item:', error)
			shoppingFeedback = error.message || ''
			shoppingFeedbackCode = error.code || 'shopping.msg.itemUpdateFail'
		}
	}

	async function handleDeleteItem(uid) {
		shoppingFeedback = ''
		shoppingFeedbackCode = null
		shoppingFeedbackVars = {}
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
				shoppingFeedback = ''
				shoppingFeedbackCode = response.code || 'shopping.msg.itemDeleted'
			} else {
				shoppingFeedback = response.error || ''
				shoppingFeedbackCode = response.code || 'shopping.msg.itemDeleteFail'
			}
		} catch (error) {
			console.error('Error deleting item:', error)
			shoppingFeedback = error.message || ''
			shoppingFeedbackCode = error.code || 'shopping.msg.itemDeleteFail'
		}
	}

	let uncheckedItems = $derived(shoppingList.filter((item) => !item.purchased))
	let purchasedItems = $derived(shoppingList.filter((item) => item.purchased))

	// Auto-show purchased items when all items are purchased, hide when no purchased items
	$effect(() => {
		if (uncheckedItems.length === 0 && purchasedItems.length > 0) {
			showHidden = true
		} else if (purchasedItems.length === 0) {
			showHidden = false
		}
	})
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
	<h2>{$t('shopping.title')}</h2>
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
		onDeletePurchased={() => (isDeleteDialogOpen = true)}
	/>
</div>
{#if shoppingList.length === 0}
	<InfoText class="my-2">{$t('shopping.empty')}</InfoText>
{/if}

<ShoppingItemInput
	bind:value={newIngredient}
	onAdd={handleAddIngredient}
	onKeyPress={handleKeyPressIngredient}
/>
<FeedbackMessage
	message={shoppingFeedback}
	messageCode={shoppingFeedbackCode}
	messageVars={shoppingFeedbackVars}
/>

{#if sortedUncheckedItems.length > 0}
	<h3 class="mt-2 mb-2">{$t('shopping.toBuy')}</h3>
{/if}
<ul class="list bg-base-100 rounded-box shadow-md divide-y divide-base-300">
	{#each sortedUncheckedItems as item (item.uid)}
		<ShoppingListItem
			{item}
			onCheckboxChange={handleCheckboxChange}
			onEdit={openEditModal}
			onTogglePurchase={(targetItem) => handlePurchaseToggle(targetItem, !targetItem.purchased)}
			purchaseLoading={purchaseLoadingByUid[item.uid] ?? false}
		/>
	{/each}
</ul>

{#if showHidden}
	<h3 class="mt-4 mb-2">{$t('shopping.purchased')}</h3>
	<InfoText class="my-2">{$t('shopping.uncheckToAdd')}</InfoText>
	<ul class="list bg-base-100 rounded-box shadow-md divide-y divide-base-300">
		{#each sortedPurchasedItems as item (item.uid)}
			<ShoppingListItem
				{item}
				onCheckboxChange={handleCheckboxChange}
				onEdit={openEditModal}
				onTogglePurchase={(targetItem) => handlePurchaseToggle(targetItem, !targetItem.purchased)}
				purchaseLoading={purchaseLoadingByUid[item.uid] ?? false}
			/>
		{/each}
	</ul>
{/if}
{#if hiddenMatches.length > 0}
	<p class="prose text-xs mt-3 mb-2 flex justify-center max-w-none">
		{$t('shopping.previouslyBought')}
	</p>
	<ul class="list bg-base-100 rounded-box shadow-md divide-y divide-base-300">
		{#each hiddenMatches as item (item.uid)}
			<ShoppingListItem
				{item}
				onCheckboxChange={handleCheckboxChange}
				onEdit={openEditModal}
				onTogglePurchase={(targetItem) => handlePurchaseToggle(targetItem, !targetItem.purchased)}
				purchaseLoading={purchaseLoadingByUid[item.uid] ?? false}
			/>
		{/each}
	</ul>
{/if}

<ConfirmationDialog
	isOpen={isDeleteDialogOpen}
	onConfirm={handleDelete}
	onClose={() => (isDeleteDialogOpen = false)}
>
	{#snippet content()}
		<div>
			<h2>{$t('shopping.confirmDeleteTitle')}</h2>
			<p>{$t('shopping.confirmDeleteDesc')}</p>
		</div>
	{/snippet}
</ConfirmationDialog>

<ConfirmationDialog
	isOpen={isCheckAllDialogOpen}
	onConfirm={handleCheckAll}
	onClose={() => (isCheckAllDialogOpen = false)}
>
	{#snippet content()}
		<div>
			<h2>{$t('shopping.confirmPurchaseAllTitle')}</h2>
			<p>{$t('shopping.confirmPurchaseAllDesc')}</p>
		</div>
	{/snippet}
</ConfirmationDialog>

<ShoppingEditDialog
	bind:isOpen={isEditDialogOpen}
	bind:item={editingItem}
	onSave={handleSaveEdit}
	onDelete={handleDeleteItem}
/>
