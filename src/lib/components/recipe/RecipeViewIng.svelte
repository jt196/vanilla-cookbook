<script>
	import { addIngredientToShoppingList } from '$lib/utils/crud'
	import { decimalToFraction, roundIngredientQuantity } from '$lib/utils/filters'
	import Shopping from '$lib/components/svg/Shopping.svelte'
	import Badge from '$lib/components/ui/Badge.svelte'
	import { i18nMap } from '$lib/submodules/recipe-ingredient-parser/src/i18n'

	/** @type {{ingredient: any, ingredientIndex?: number, scale: any, displayExtra: any, displayDryMatch: any, displayOriginal: any, selectedSystem: any, recipeUid: any}} */
	let {
		ingredient,
		ingredientIndex = 0,
		scale,
		displayExtra,
		displayDryMatch,
		displaySymbol,
		displayOriginal,
		selectedSystem,
		recipeUid,
		userLanguage = 'eng'
	} = $props()

	let scaleIng = $state(1)

	let struckThrough = $state(false)
	let isHighlighted = $state(false)
	let showAlternatives = $state(false)

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

	const formatQuantity = (qty, min, max, unit = null) => {
		const hasQty = qty !== null && qty !== undefined && qty !== ''
		const hasRangeValues = min !== null && min !== undefined && max !== null && max !== undefined
		const isNoUnitZeroPlaceholder =
			!unit &&
			(hasQty || hasRangeValues) &&
			Number(qty ?? 0) === 0 &&
			Number(min ?? 0) === 0 &&
			Number(max ?? 0) === 0
		if (isNoUnitZeroPlaceholder) return ''
		const hasMeaningfulRange = hasRangeValues && !(!hasQty && Number(min) === 0 && Number(max) === 0)
		if (!hasQty && !hasMeaningfulRange) return ''
		if (hasMeaningfulRange && min !== max) {
			return selectedSystem === 'metric'
				? `${roundIngredientQuantity(min * scaleIng)}-${roundIngredientQuantity(max * scaleIng)}`
				: `${decimalToFraction(min * scaleIng)}-${decimalToFraction(max * scaleIng)}`
		}
		const baseQty = hasQty ? qty : hasMeaningfulRange ? min : null
		if (baseQty === null) return ''
		return selectedSystem === 'metric'
			? roundIngredientQuantity(baseQty * scaleIng)
			: decimalToFraction(baseQty * scaleIng)
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

	const badgeLabels = $derived.by(() => {
		const langData = i18nMap[userLanguage] ?? i18nMap.eng
		return langData.badgeLabels ?? i18nMap.eng.badgeLabels
	})

	function parseMarkdownHeading(line) {
		if (typeof line !== 'string') return null
		const match = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/)
		if (!match) return null

		return {
			level: match[1].length,
			text: match[2]
		}
	}

	const markdownHeading = $derived.by(() =>
		parseMarkdownHeading(ingredient?.originalString ?? ingredient?.ingredient)
	)

	const headingLevelClasses = {
		1: 'text-xl font-bold',
		2: 'text-lg font-semibold',
		3: 'text-base font-semibold',
		4: 'text-sm font-semibold',
		5: 'text-sm font-medium uppercase tracking-wide',
		6: 'text-xs font-medium uppercase tracking-wide'
	}

	function getHeadingClasses(level, index) {
		const sizeClasses = headingLevelClasses[level] ?? headingLevelClasses[3]
		const spacingClasses = index === 0 ? 'mt-0 mb-1' : 'mt-2 mb-1'
		return `${spacingClasses} leading-tight ${sizeClasses}`
	}

	const displayQuantityText = $derived(
		formatQuantity(ingredient.quantity, ingredient.minQty, ingredient.maxQty, ingredient.unit)
	)
	const displayQuantityForPlural = $derived.by(() => {
		if (ingredient.quantity !== null && ingredient.quantity !== undefined) return ingredient.quantity * scaleIng
		if (
			ingredient.maxQty !== null &&
			ingredient.maxQty !== undefined &&
			!(Number(ingredient.maxQty) === 0 && Number(ingredient.minQty) === 0)
		) {
			return ingredient.maxQty * scaleIng
		}
		return 0
	})
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
			{:else if markdownHeading}
				<div data-heading>
					<svelte:element
						this={`h${markdownHeading.level}`}
						class={getHeadingClasses(markdownHeading.level, ingredientIndex)}>
						{markdownHeading.text}
					</svelte:element>
				</div>
			{:else}
				<li class:struck={struckThrough}>
					{#if displayOriginal}
						<i>{ingredient.originalString}</i>
					{:else}
						<strong>
							{displayQuantityText}
						</strong>
						<i>
							{#if ingredient.unit && ingredient.unit !== 'q.b.'}
								{#if displaySymbol && ingredient.symbol}
									{ingredient.symbol}
								{:else}
									{displayQuantityForPlural > 1 && ingredient.unitPlural
										? ingredient.unitPlural
										: ingredient.unit}
								{/if}
							{/if}
						</i>
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
										ingredient.perItemMaxQty,
										ingredient.unit
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
							{#if ingredient.approx}
								<Badge color="secondary" style="outline" title={badgeLabels.approx.title}>
									{badgeLabels.approx.short}
								</Badge>
							{/if}
							{#if ingredient.optional}
								<Badge color="secondary" style="outline" title={badgeLabels.optional.title}>
									{badgeLabels.optional.short}
								</Badge>
							{/if}
							{#if ingredient.toServe}
								<Badge color="secondary" style="outline" title={badgeLabels.toServe.title}>
									{badgeLabels.toServe.short}
								</Badge>
							{/if}
							{#if ingredient.toTaste}
								<Badge color="secondary" style="outline" title={badgeLabels.toTaste.title}>
									{badgeLabels.toTaste.short}
								</Badge>
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
						{#if alt.quantity !== null && alt.quantity !== undefined}
							<strong>
								{formatQuantity(alt.quantity, alt.minQty, alt.maxQty, alt.unit)}
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
						<span class="alt-badges">
							{#if alt.unit || (alt.quantity !== null && alt.quantity !== undefined)}
								<Badge color="primary" style="outline">unit</Badge>
							{/if}
							{#if alt.ingredient}
								<Badge color="primary" style="outline">ing</Badge>
							{/if}
						</span>
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
			left: 0;
			transform: translateX(-100%);
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

	.alt-badges {
		display: inline-flex;
		gap: 0.25rem;
		margin-right: 0.35rem;
	}
</style>
