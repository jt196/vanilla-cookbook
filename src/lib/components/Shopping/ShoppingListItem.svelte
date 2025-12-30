<script>
	import { fade } from 'svelte/transition'
	import Link from '$lib/components/svg/Link.svelte'
	import Edit from '$lib/components/svg/Edit.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'

	let {
		/**
		 * @type {any}
		 */
		item,
		/**
		 * @type {(item: any, event: Event) => void}
		 */
		onCheckboxChange,
		/**
		 * @type {(item: any) => void}
		 */
		onEdit
	} = $props()
</script>

<li class="list-row items-center gap-3" out:fade={{ duration: 300 }}>
	<Checkbox
		name={item.name}
		checked={item.purchased}
		color="accent"
		size="xl"
		onchange={(checked) => onCheckboxChange(item, { target: { checked } })}
		class="mt-0.5" />

	<div class="flex flex-col gap-1 flex-1 min-w-0">
		<div class="flex items-center gap-2">
			<span class={`font-medium ${item.purchased ? 'line-through opacity-60' : ''}`}>
				{item.name}
			</span>
			{#if item.recipeUid}
				<a
					href="/recipe/{item.recipeUid}/view"
					class="btn btn-ghost btn-circle btn-xs text-base-content"
					title={item.recipe?.name ?? 'View recipe'}>
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

	<Button
		color="primary"
		class="btn-square"
		id="edit-item"
		aria-label="Edit item"
		onclick={() => onEdit(item)}>
		<Edit width="18px" height="18px" />
	</Button>
</li>
