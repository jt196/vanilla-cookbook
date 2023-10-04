<script>
	import { decimalToFraction } from '$lib/utils/filters'

	export let ingredient
	export let scale
	export let displayExtra
	export let displayDryMatch
	export let displayOriginal
</script>

{#if ingredient.ingredient.trim() === ''}
	<li>
		{ingredient.originalString}
	</li>
{:else if /<h[1-6]>/.test(ingredient.ingredient)}
	<div data-heading>{@html ingredient.ingredient}</div>
{:else}
	<li>
		<strong>
			{#if ingredient.minQty == ingredient.maxQty && ingredient.quantity}
				{decimalToFraction(ingredient.quantity * scale)}
			{:else if ingredient.minQty != ingredient.maxQty && ingredient.quantity}
				{decimalToFraction(ingredient.minQty * scale)}-{decimalToFraction(
					ingredient.maxQty * scale
				)}
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
				<i> | {ingredient.dryIngredient.names[0]} ({ingredient.dryIngredient.gramsPerCup} g/cup)</i>
			{/if}
			{#if displayOriginal}
				<i> | {ingredient.originalString}</i>
			{/if}
		</span>
	</li>
{/if}

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
</style>
