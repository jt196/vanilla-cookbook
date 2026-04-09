<script>
	import { fade } from 'svelte/transition'
	import Link from '$lib/components/svg/Link.svelte'
	import Edit from '$lib/components/svg/Edit.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import { t } from '$lib/stores/locale.js'

	let {
		/** @type {any} */
		item,
		/** @type {(item: any, event: Event) => void} */
		onCheckboxChange,
		/** @type {(item: any) => void} */
		onEdit,
		/** @type {(item: any) => void} */
		onTogglePurchase,
		/** @type {boolean} */
		purchaseLoading = false
	} = $props()

	let purchaseCount = $derived(item?.purchaseCount ?? item?.purchaseLogs?.length ?? 0)
</script>

<li class="list-row items-center gap-3" out:fade={{ duration: 300 }}>
	<Checkbox
		name={item.name}
		checked={item.purchased}
		color="accent"
		size="xl"
		onchange={(checked) => onCheckboxChange(item, { target: { checked } })}
		class="self-center"
	/>

	<div class="flex flex-col gap-1 flex-1 min-w-0">
		<div class="flex items-center gap-2">
			<span class={`prose prose-xl ${item.purchased ? 'line-through opacity-60' : ''}`}>
				{item.name}
			</span>
			{#if item.recipeUid}
				<a
					href="/recipe/{item.recipeUid}/view"
					class="btn btn-ghost btn-circle btn-xs text-base-content"
					title={item.recipe?.name ?? $t('shopping.viewRecipe')}
				>
					<Link width="18px" />
				</a>
			{/if}
		</div>
		<div class="text-sm opacity-70 flex items-center gap-2">
			{#if item.quantity}
				<span>{item.quantity}</span>
			{/if}
			{#if item.unit}
				<span>{item.unit}</span>
			{/if}
		</div>
	</div>

	<div class="flex items-center gap-2">
		<Button
			onclick={() => onTogglePurchase && onTogglePurchase(item)}
			class={`btn btn-soft btn-primary btn-sm tooltip ${purchaseCount > 0 ? 'text-success' : ''}`}
			disabled={purchaseLoading}
			data-tip={purchaseCount > 0
				? $t(
						purchaseCount === 1 ? 'shopping.purchasedTimes_one' : 'shopping.purchasedTimes_other',
						{ count: purchaseCount }
					)
				: $t('shopping.markItemPurchased')}
		>
			{#if purchaseLoading}
				<span class="loading loading-spinner loading-sm"></span>
			{:else if purchaseCount > 1}
				<span class="badge badge-success badge-sm text-success-content font-bold min-w-5">
					{purchaseCount}
				</span>
			{:else}
				<Check checked={purchaseCount > 0} width="20px" height="20px" fill="currentColor" />
			{/if}
		</Button>
		<Button
			onclick={() => onEdit(item)}
			class="btn btn-soft btn-primary btn-sm tooltip"
			data-tip={$t('shopping.editItem')}
			id="edit-item"
			aria-label={$t('shopping.editItem')}
		>
			<Edit width="18px" height="18px" fill="currentColor" />
		</Button>
	</div>
</li>
