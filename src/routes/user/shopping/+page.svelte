<script>
	import { hidePurchasedItems, updateShoppingListItem } from '$lib/utils/crud.js'
	import Link from '$lib/components/svg/Link.svelte'
	import { fade } from 'svelte/transition'
	import { sortByTwoKeys } from '$lib/utils/sorting.js'

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
					return purchased ? { ...listItem, purchased } : { ...listItem, purchased, hidden: false }
				}
				return listItem
			})

			data.shoppingList = updatedList
		}, 300)
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
		} catch (error) {
			console.error('Error hiding purchased items:', error.message)
			// Handle the error (e.g., show an error message to the user)
		}
	}

	let showHidden = false

	function toggleHidden() {
		showHidden = !showHidden
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
		{showHidden ? 'Hide' : 'Show'} Hidden Items
	</button>

	<button on:click={handleHide}>Hide Purchased Items</button>
</div>
<fieldset>
	{#each sortedList as item (item.uid)}
		{#if !item.hidden || showHidden}
			<div out:fade={{ duration: 300 }}>
				<div class="unit-quantity">
					{item.quantity}
					{item.unit}
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

<style>
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
		padding: 0;
		color: var(--pico-muted-color);
	}
</style>
