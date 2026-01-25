<script>
	import View from '$lib/components/svg/View.svelte'
	import ViewNo from '$lib/components/svg/ViewNo.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import CheckAll from '$lib/components/svg/CheckAll.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	let {
		/**
		 * @type {boolean}
		 */
		showHidden = false,
		/**
		 * @type {number}
		 */
		uncheckedItemCount = 0,
		/**
		 * @type {number}
		 */
		purchasedItemCount = 0,
		/**
		 * @type {'name' | 'purchaseCount'}
		 */
		sortBy = 'name',
		/**
		 * @type {boolean}
		 */
		sortByPurchased = false,
		/**
		 * @type {() => void}
		 */
		onToggleHidden,
		/**
		 * @type {() => void}
		 */
		onCheckAll,
		/**
		 * @type {() => void}
		 */
		onDeletePurchased,
		/**
		 * @type {() => void}
		 */
		onTogglePurchasedSort,
		/**
		 * @type {(sortBy: 'name' | 'purchaseCount') => void}
		 */
		onSortChange
	} = $props()

	const purchasedFilterBtnClasses = $derived(
		['tooltip', sortByPurchased ? 'opacity-100 text-success' : 'opacity-60', 'hover:opacity-100']
			.filter(Boolean)
			.join(' ')
	)
</script>

<div class="shopping-buttons">
	<Button
		onclick={onToggleHidden}
		class="tooltip"
		data-tip={showHidden ? 'Show Unpurchased Items' : 'Show Purchased Items'}>
		{#if showHidden}
			<View width="20px" height="20px" fill="white" />
		{:else}
			<ViewNo width="20px" height="20px" fill="white" />
		{/if}
	</Button>

	<Button
		style="outline"
		size="md"
		color="success"
		onclick={onTogglePurchasedSort}
		class={`btn-square ${purchasedFilterBtnClasses}`}
		data-tip="Sort by Purchase Count">
		<Check checked={sortByPurchased} width="20px" height="20px" fill="currentColor" />
	</Button>

	<Button
		disabled={uncheckedItemCount === 0}
		onclick={onCheckAll}
		class="tooltip"
		data-tip="Mark all items as purchased">
		<CheckAll width="20px" height="20px" fill="white" />
	</Button>

	<Button
		disabled={purchasedItemCount === 0}
		onclick={onDeletePurchased}
		class="tooltip"
		data-tip="Delete all purchased items">
		<Delete width="20px" height="20px" fill="white" />
	</Button>
</div>

<style>
	.shopping-buttons {
		margin-bottom: 1rem;
	}
</style>
