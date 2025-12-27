<script>
	import { fade } from 'svelte/transition'
	import Link from '$lib/components/svg/Link.svelte'
	import Edit from '$lib/components/svg/Edit.svelte'
	import Button from '$lib/components/ui/Button.svelte'

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

<div class="list-item" out:fade={{ duration: 300 }}>
	<div class="item-qty-unit">
		<div class="item-label">
			<label class:checked={item.purchased}>
				<input
					type="checkbox"
					name={item.name}
					checked={item.purchased}
					onchange={(event) => onCheckboxChange(item, event)} />
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
		<Button class="outline contrast" id="edit-item" onclick={() => onEdit(item)}
			><Edit width="20px" height="20px" fill="var(--pico-ins-color)" /></Button>
	</div>
</div>

<style lang="scss">
	.checked {
		color: var(--pico-muted-color);
	}

	.list-item {
		display: flex;
		border-bottom: 0.5px solid var(--pico-primary-focus);
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0;

		@media (max-width: 767px) {
			padding: 0;
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

				:global(.outline) {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					height: 40px;
					padding: 0 10px;
				}
			}
		}
	}

	.unit-quantity {
		margin: 0;
		padding: 0 0.5rem;
		color: var(--pico-muted-color);
	}
</style>
