<script>
	import { hidePurchasedItems, updateShoppingListItem } from '$lib/utils/crud.js'
	import Link from '$lib/components/svg/Link.svelte'

	export let data
	console.log('🚀 ~ data:', data.shoppingList)

	async function handleCheckboxChange(item, event) {
		const purchased = event.target.checked
		await updateShoppingListItem({ uid: item.uid, purchased })

		// Update local state to reflect the change
		const updatedList = data.shoppingList.map((listItem) => {
			if (listItem.uid === item.uid) {
				// If the item is unchecked (purchased is false), also set hidden to false
				// Otherwise, just update the purchased status
				return purchased ? { ...listItem, purchased } : { ...listItem, purchased, hidden: false }
			}
			return listItem
		})

		data.shoppingList = updatedList
	}

	async function handleHide() {
		try {
			await hidePurchasedItems() // Call your API to update the database
			data.shoppingList = data.shoppingList.map((item) => {
				if (item.purchased) {
					return { ...item, hidden: true } // Update local data to set hidden=true for purchased items
				}
				return item
			})
			console.log(
				'🚀 ~ data.shoppingList=data.shoppingList.map ~ data.shoppingList:',
				data.shoppingList
			)
		} catch (error) {
			console.error('Error hiding purchased items:', error.message)
			// Handle the error (e.g., show an error message to the user)
		}
	}

	let showHidden = false

	function toggleHidden() {
		showHidden = !showHidden
	}
</script>

<h4>Shopping List</h4>

<div class="shopping-buttons">
	<button on:click={toggleHidden}>
		{showHidden ? 'Hide' : 'Show'} Hidden Items
	</button>

	<button on:click={handleHide}>Hide Purchased Items</button>
</div>
<fieldset>
	{#each data.shoppingList as item}
		{#if !item.hidden || showHidden}
			<label class:checked={item.purchased}>
				<input
					type="checkbox"
					name={item.name}
					checked={item.purchased}
					on:change={(event) => handleCheckboxChange(item, event)} />
				{item.quantity}
				{item.unit}
				{item.name}
				{#if item.recipeUid}
					<a href="/recipe/{item.recipeUid}/view"
						><Link width="20px" fill="var(--pico-primary)" /></a>
				{/if}
			</label>
		{/if}
	{/each}
</fieldset>

<style>
	.checked {
		color: var(--pico-muted-color);
	}
	.shopping-buttons {
		margin-bottom: 1rem;
	}
</style>
