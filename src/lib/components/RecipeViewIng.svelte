<script>
	import { addIngredientToShoppingList } from '$lib/utils/crud'
	import { decimalToFraction, roundIngredientQuantity } from '$lib/utils/filters'
	import Shopping from './svg/Shopping.svelte'

	/** @type {{ingredient: any, scale: any, displayExtra: any, displayDryMatch: any, displayOriginal: any, selectedSystem: any, recipeUid: any}} */
	let {
		ingredient,
		scale,
		displayExtra,
		displayDryMatch,
		displaySymbol,
		displayOriginal,
		selectedSystem,
		recipeUid
	} = $props()

	let scaleIng = $state(1)

	let struckThrough = $state(false)
	let isHighlighted = $state(false)
	let showAlternatives = $state(false)
	const systemMarkers = {
		metric: '¹',
		imperial: '²',
		americanVolumetric: '³'
	}

	// Step 2: Modify handleClick to toggle the struckThrough state
	function handleClick() {
		struckThrough = !struckThrough // Toggle the state
	}

	async function handleAddToShoppingList(ingredient) {
		let updatedIngredient = { ...ingredient, recipeUid }
		let response = await addIngredientToShoppingList(updatedIngredient)

		if (response.success) {
			isHighlighted = true
			setTimeout(() => (isHighlighted = false), 1000) // Reset the flag after 1 second

			// Optionally, show a success message or perform other actions
		} else {
			// Handle error case, maybe show an error message to the user
		}
	}

	function handleScale(scale) {
		if (isNaN(scale) || scale < 0) {
			return 1
		}
		return parseFloat(scale)
	}

	$effect(() => {
		scaleIng = handleScale(scale)
	})

	const formatQuantity = (qty, min, max) => {
		if (!qty) return ''
		if (min !== undefined && max !== undefined && min !== max) {
			return selectedSystem === 'metric'
				? `${roundIngredientQuantity(min * scaleIng)}-${roundIngredientQuantity(max * scaleIng)}`
				: `${decimalToFraction(min * scaleIng)}-${decimalToFraction(max * scaleIng)}`
		}
		return selectedSystem === 'metric'
			? roundIngredientQuantity(qty * scaleIng)
			: decimalToFraction(qty * scaleIng)
	}

	const renderUnit = (entry, qtyScaled) => {
		if (!entry?.unit || entry.unit === 'q.b.') return ''
		if (displaySymbol && entry.symbol) return entry.symbol
		const usePlural = qtyScaled > 1 && entry.unitPlural
		return usePlural ? entry.unitPlural : entry.unit
	}

	const stopExtras = ['and', 'or']
	const extraText = $derived.by(() => {
		if (!displayExtra || !ingredient.additional) return null
		const parts = ingredient.additional
			.split(',')
			.map((p) => p.trim())
			.filter(Boolean)
			.filter((p) => !stopExtras.includes(p.toLowerCase()) && p.length > 2)
		return parts.length ? parts.join(', ') : null
	})

	const inlineAlternatives = $derived.by(() =>
		(ingredient.alternatives || []).filter(
			(alt) =>
				(alt.quantity === null || alt.quantity === undefined) &&
				(!alt.unit || alt.unit === null) &&
				alt.ingredient &&
				alt.ingredient.trim().length > 0
		)
	)

	const panelAlternatives = $derived.by(() =>
		(ingredient.alternatives || []).filter(
			(alt) =>
				!(alt.quantity === null || alt.quantity === undefined) || (alt.unit && alt.unit !== null)
		)
	)
</script>

<div class="ingredient-line" class:highlight={isHighlighted}>
	<button class="add-btn" onclick={() => handleAddToShoppingList(ingredient)}
		><Shopping width="10px" fill="white" /></button>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div onclick={handleClick}>
		{#if typeof ingredient.ingredient === 'string'}
			{#if ingredient.ingredient.trim() === ''}
				<li class:struck={struckThrough}>
					{ingredient.originalString}
				</li>
			{:else if /<h[1-6]>/.test(ingredient.ingredient)}
				<div data-heading>{@html ingredient.ingredient}</div>
			{:else}
				<li class:struck={struckThrough}>
					{#if displayOriginal}
						<i>{ingredient.originalString}</i>
					{:else}
						<strong>
							{#if ingredient.minQty == ingredient.maxQty && ingredient.quantity}
								{#if selectedSystem === 'metric'}
									{roundIngredientQuantity(ingredient.quantity * scaleIng)}
								{:else}
									{decimalToFraction(ingredient.quantity * scaleIng)}
								{/if}
							{:else if ingredient.minQty != ingredient.maxQty && ingredient.quantity}
								{#if selectedSystem === 'metric'}
									{roundIngredientQuantity(ingredient.minQty * scaleIng)}-{roundIngredientQuantity(
										ingredient.maxQty * scaleIng
									)}
								{:else}
									{decimalToFraction(ingredient.minQty * scaleIng)}-{decimalToFraction(
										ingredient.maxQty * scaleIng
									)}
								{/if}
							{/if}
						</strong>
						<i>
							{#if ingredient.unit && ingredient.unit !== 'q.b.'}
								{#if displaySymbol && ingredient.symbol}
									{ingredient.symbol}
								{:else}
									{ingredient.quantity * scaleIng > 1 && ingredient.unitPlural
										? ingredient.unitPlural
										: ingredient.unit}
								{/if}
							{/if}
						</i>
						{#if ingredient.approx}<span class="badge" title="Approximate">~</span>{/if}
						{#if ingredient.optional}<span class="badge" title="Optional">opt</span>{/if}
						{#if ingredient.toServe}<span class="badge" title="To serve">srv</span>{/if}
						{#if ingredient.toTaste}<span class="badge" title="To taste">tt</span>{/if}
						<span>
							{@html ingredient.ingredient}
							{#if extraText}
								<i> | {extraText}</i>
							{/if}
							{#if inlineAlternatives.length}
								<span class="inline-alts">
									| {inlineAlternatives.map((alt) => alt.ingredient).join(' | ')}
								</span>
							{/if}
							{#if displayDryMatch && ingredient.dryIngredient}
								<i>
									| {ingredient.dryIngredient.name} ({ingredient.dryIngredient.gramsPerCup} g/cup)</i>
							{/if}
							{#if ingredient.usedDefaultDensity === true}
								*
							{/if}
							{#if ingredient.instructions && ingredient.instructions.length}
								<small class="muted">
									— {ingredient.instructions.join(', ')}
								</small>
							{/if}
							{#if ingredient.multiplier && ingredient.perItemQuantity}
								<small class="muted">
									(per item:
									{formatQuantity(
										ingredient.perItemQuantity,
										ingredient.perItemMinQty,
										ingredient.perItemMaxQty
									)}
									{#if ingredient.unit}
										{' '}
										{renderUnit(
											ingredient,
											ingredient.perItemQuantity ? ingredient.perItemQuantity * scaleIng : 0
										)}
									{/if}
									)
								</small>
							{/if}
							{#if panelAlternatives.length}
								<button
									class="alt-toggle"
									type="button"
									aria-label="Toggle alternatives"
									aria-expanded={showAlternatives}
									onclick={(event) => {
										event.stopPropagation()
										showAlternatives = !showAlternatives
									}}>
									<span class="chevron" aria-hidden="true">▸</span>
								</button>
							{/if}
						</span>
					{/if}
				</li>
			{/if}
		{/if}
	</div>
</div>
{#if panelAlternatives.length && showAlternatives}
	<div class="alts-panel">
		<ul>
			{#each panelAlternatives as alt}
				{#if alt}
					<li>
						{#if alt.quantity}
							<strong>
								{formatQuantity(alt.quantity, alt.minQty, alt.maxQty)}
							</strong>
						{/if}
						{#if alt.unit}
							<i>
								{renderUnit(alt, alt.quantity ? alt.quantity * scaleIng : alt.quantity)}
							</i>
						{/if}
						<span>{alt.ingredient}</span>
						{#if alt.additional}
							<small class="muted"> — {alt.additional}</small>
						{/if}
						{#if alt.instructions && alt.instructions.length}
							<small class="muted">
								— {alt.instructions.join(', ')}
							</small>
						{/if}
					</li>
				{/if}
			{/each}
		</ul>
	</div>
{/if}

<style lang="scss">
	li {
		list-style-type: none;
	}

	details {
		margin: 0 !important;
		padding: 3px;
		background-color: var(--pico-text-selection-color);
		border-radius: 5px;
	}

	.struck {
		text-decoration: line-through;
	}

	.ingredient-line {
		display: flex;
		gap: 10px;
		position: relative;
		padding-left: 3px;
		transition: background-color 0.3s ease;
		&:hover {
			background-color: var(--pico-secondary-focus);
			border-radius: 5px;
		}

		.add-btn {
			position: absolute;
			left: 0; // Position the button to the far left
			transform: translateX(-100%); // Move the button to the left of the container
			padding: 0 0.2rem;
			margin-bottom: 0.1rem;
			max-height: 33px;
			opacity: 0;
			visibility: hidden;
			transition:
				opacity 0.3s ease,
				visibility 0s linear 0.3s;
		}

		&:hover .add-btn,
		&:focus-within .add-btn {
			opacity: 1;
			visibility: visible;
			transition-delay: 0s;
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

	.muted {
		color: var(--pico-muted-color);
	}

	.inline-alts {
		margin-left: 0.25rem;
	}

	.alt-toggle {
		background: transparent;
		border: none;
		color: var(--pico-muted-color);
		cursor: pointer;
		padding: 0 0.25rem;
		margin: 0 0.35rem;
	}

	.alt-toggle .chevron {
		display: inline-block;
		transition: transform 0.2s ease;
	}

	.alt-toggle[aria-expanded='true'] .chevron {
		transform: rotate(90deg);
	}

	.alts-panel {
		margin-left: 1.5rem;
		margin-top: 0.1rem;
		margin: 0.1rem 0;
		border-radius: 0.2rem;
		background: var(--pico-primary-focus);
	}

	.alts-panel ul {
		list-style: none;
		padding-left: 0.2rem;
		margin: 0.1rem 0 0 0;
	}

	.alt-label {
		display: inline-block;
		margin-right: 0.35rem;
		padding: 0 0.35rem;
		border-radius: 999px;
		background: var(--pico-secondary-border);
		color: var(--pico-muted-color);
		font-size: 0.7rem;
		text-transform: lowercase;
	}
</style>
