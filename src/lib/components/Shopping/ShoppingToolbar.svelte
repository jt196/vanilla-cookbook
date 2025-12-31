<script>
	import View from '$lib/components/svg/View.svelte'
	import ViewNo from '$lib/components/svg/ViewNo.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import CheckAll from '$lib/components/svg/CheckAll.svelte'
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
		onDeletePurchased
	} = $props()
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
