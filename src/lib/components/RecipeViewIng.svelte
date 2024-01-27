<script>
	import { addIngredientToShoppingList } from '$lib/utils/crud'
	import { decimalToFraction, roundIngredientQuantity } from '$lib/utils/filters'

	export let ingredient
	export let scale
	export let displayExtra
	export let displayDryMatch
	export let displayOriginal
	export let selectedSystem

	let struckThrough = false
	let isHighlighted = false

	// Step 2: Modify handleClick to toggle the struckThrough state
	function handleClick() {
		struckThrough = !struckThrough // Toggle the state
	}

	async function handleAddToShoppingList(ingredient) {
		let response = await addIngredientToShoppingList(ingredient)

		if (response.success) {
			isHighlighted = true
			setTimeout(() => (isHighlighted = false), 1000) // Reset the flag after 1 second

			// Optionally, show a success message or perform other actions
		} else {
			// Handle error case, maybe show an error message to the user
		}
	}
</script>

<div class="ingredient-line" class:highlight={isHighlighted}>
	<button on:click={() => handleAddToShoppingList(ingredient)}>+</button>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div on:click={handleClick}>
		{#if typeof ingredient.ingredient === 'string'}
			{#if ingredient.ingredient.trim() === ''}
				<li class:struck={struckThrough}>
					{ingredient.originalString}
				</li>
			{:else if /<h[1-6]>/.test(ingredient.ingredient)}
				<div data-heading>{@html ingredient.ingredient}</div>
			{:else}
				<li class:struck={struckThrough}>
					<strong>
						{#if ingredient.minQty == ingredient.maxQty && ingredient.quantity}
							{#if selectedSystem === 'metric'}
								{roundIngredientQuantity(ingredient.quantity * scale)}
							{:else}
								{decimalToFraction(ingredient.quantity * scale)}
							{/if}
						{:else if ingredient.minQty != ingredient.maxQty && ingredient.quantity}
							{#if selectedSystem === 'metric'}
								{roundIngredientQuantity(ingredient.minQty * scale)}-{roundIngredientQuantity(
									ingredient.maxQty * scale
								)}
							{:else}
								{decimalToFraction(ingredient.minQty * scale)}-{decimalToFraction(
									ingredient.maxQty * scale
								)}
							{/if}
						{/if}
					</strong>
					{#if ingredient.unit && ingredient.unit !== 'q.b.'}
						{ingredient.quantity * scale > 1 && ingredient.unitPlural
							? ingredient.unitPlural
							: ingredient.unit}
					{/if}
					<span
						>{@html ingredient.ingredient}
						{#if displayExtra && ingredient.additional}
							<i> | {ingredient.additional}</i>
						{/if}
						{#if displayDryMatch && ingredient.dryIngredient}
							<i>
								| {ingredient.dryIngredient.name} ({ingredient.dryIngredient.gramsPerCup} g/cup)</i>
						{/if}
						{#if displayOriginal}
							<i> | {ingredient.originalString}</i>
						{/if}
					</span>
				</li>
			{/if}
		{/if}
	</div>
</div>

<style lang="scss">
	// Ingredients headers in the middle of text to have some spacing
	h4:not(:first-child) {
		margin-top: 20px;
	}
	h4:first-child {
		margin-top: 0;
	}
	li {
		list-style-type: none;
	}

	.struck {
		text-decoration: line-through;
	}

	.ingredient-line {
		display: flex;
		gap: 5px;
		button {
			padding: 0 0.2rem;
			margin-bottom: 0.1rem;
		}
	}

	@keyframes highlight {
		0% {
			background-color: initial;
		}
		50% {
			background-color: var(--pico-primary);
		}
		100% {
			background-color: initial;
		}
	}

	.highlight {
		animation: highlight 1s; /* Adjust the duration as needed */
	}
</style>
