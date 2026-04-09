<script>
	import View from '$lib/components/svg/View.svelte'
	import ViewNo from '$lib/components/svg/ViewNo.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import CheckAll from '$lib/components/svg/CheckAll.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { t } from '$lib/stores/locale.js'

	let {
		/** @type {boolean} */
		showHidden = false,
		/** @type {number} */
		uncheckedItemCount = 0,
		/** @type {number} */
		purchasedItemCount = 0,
		/** @type {boolean} */
		sortByPurchased = false,
		/** @type {() => void} */
		onToggleHidden,
		/** @type {() => void} */
		onCheckAll,
		/** @type {() => void} */
		onDeletePurchased,
		/** @type {() => void} */
		onTogglePurchasedSort
	} = $props()
</script>

<div class="shopping-buttons">
	<Button
		disabled={purchasedItemCount === 0}
		onclick={onToggleHidden}
		class="tooltip"
		data-tip={showHidden ? $t('shopping.showUnpurchased') : $t('shopping.showPurchased')}>
		{#if showHidden}
			<View width="20px" height="20px" fill="white" />
		{:else}
			<ViewNo width="20px" height="20px" fill="white" />
		{/if}
	</Button>

	<Button
		onclick={onTogglePurchasedSort}
		class="tooltip"
		data-tip={$t('shopping.sortByCount')}>
		<Check checked={sortByPurchased} width="20px" height="20px" fill={sortByPurchased ? '#4ade80' : 'white'} />
	</Button>

	<Button
		disabled={uncheckedItemCount === 0}
		onclick={onCheckAll}
		class="tooltip"
		data-tip={$t('shopping.markAllPurchased')}>
		<CheckAll width="20px" height="20px" fill="white" />
	</Button>

	<Button
		disabled={purchasedItemCount === 0}
		onclick={onDeletePurchased}
		class="tooltip"
		data-tip={$t('shopping.deleteAllPurchased')}>
		<Delete width="20px" height="20px" fill="white" />
	</Button>
</div>

<style>
	.shopping-buttons {
		margin-bottom: 1rem;
	}
</style>
