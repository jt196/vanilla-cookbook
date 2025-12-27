<script>
	import Scale from '$lib/components/Scale.svelte'
	import RecipeViewIng from './RecipeViewIng.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Badge from '$lib/components/ui/Badge.svelte'

	/** @type {{ingredients: any, sanitizedIngredients: any, scale: any, scaledServings: any, selectedSystem: any, measurementSystem: any, recipeUid: any }} */
	let {
		ingredients,
		sanitizedIngredients,
		onScaleChange,
		onSelectedSystemChange,
		measurementSystem,
		recipeUid,
		scale,
		selectedSystem,
		user
	} = $props()

	let displayExtra = $state(user.ingExtra)
	let displaySymbol = $state(user.ingSymbol)
	let displayDryMatch = $state(user.ingMatch)
	let displayOriginal = $state(user.ingOriginal)

	let hasDefaultDensity = $derived(sanitizedIngredients.some((i) => i.usedDefaultDensity === true))

	const originalSystem = $derived(measurementSystem?.system || null)

	// Determine which badges are actually used in the ingredients
	const hasApprox = $derived(sanitizedIngredients.some((i) => i.approx))
	const hasOptional = $derived(sanitizedIngredients.some((i) => i.optional))
	const hasToServe = $derived(sanitizedIngredients.some((i) => i.toServe))
	const hasToTaste = $derived(sanitizedIngredients.some((i) => i.toTaste))
</script>

<div class="ing-header">
	<h3>Ingredients</h3>
</div>

{#if ingredients.length > 0}
	{#if sanitizedIngredients.some((item) => item.ingredient)}
		<p>
			<Scale {scale} {onScaleChange} />
		</p>
	{/if}
{:else}
	<p>Loading...</p>
{/if}

<div class="ingredients">
	<ul>
		{#each sanitizedIngredients as ingredient}
			<RecipeViewIng
				{ingredient}
				{recipeUid}
				{scale}
				{displayExtra}
				{displaySymbol}
				{displayDryMatch}
				{displayOriginal}
				{selectedSystem} />
		{/each}
	</ul>
	{#if hasDefaultDensity}
		<div class="default"><i> * Converted using default water density </i></div>
	{/if}
	{#if hasApprox || hasOptional || hasToServe || hasToTaste}
		<div class="legend">
			{#if hasApprox}<Badge>~</Badge> approx{/if}
			{#if hasOptional}<Badge>opt</Badge> optional{/if}
			{#if hasToServe}<Badge>srv</Badge> to serve{/if}
			{#if hasToTaste}<Badge>tt</Badge> to taste{/if}
		</div>
	{/if}
	<div class="convert">
		<div class="segmented">
			<Button
				class={`outline ${selectedSystem === 'metric' ? 'selected' : ''} ${originalSystem === 'metric' ? 'orig' : ''}`}
				onclick={() => onSelectedSystemChange('metric')}>
				Metric
			</Button>
			<Button
				class={`outline ${selectedSystem === 'americanVolumetric' ? 'selected' : ''} ${originalSystem === 'americanVolumetric' ? 'orig' : ''}`}
				onclick={() => onSelectedSystemChange('americanVolumetric')}>
				US Vol
			</Button>
			<Button
				class={`outline ${selectedSystem === 'imperial' ? 'selected' : ''} ${originalSystem === 'imperial' ? 'orig' : ''}`}
				onclick={() => onSelectedSystemChange('imperial')}>
				Imperial
			</Button>
		</div>
	</div>
	<div class="ing-settings">
		<div class="checks">
			<div class="toggle-row">
				<Button
					class={`outline ${displayOriginal ? 'selected' : ''}`}
					onclick={() => (displayOriginal = !displayOriginal)}>
					Original
				</Button>
				{#if sanitizedIngredients.some((item) => item.additional)}
					<Button
						class={`outline ${displayExtra ? 'selected' : ''}`}
						disabled={displayOriginal}
						onclick={() => (displayExtra = !displayExtra)}>
						Extra
					</Button>
				{/if}
				<Button
					class={`outline ${displayDryMatch ? 'selected' : ''}`}
					disabled={displayOriginal || selectedSystem === 'americanVolumetric'}
					onclick={() => (displayDryMatch = !displayDryMatch)}>
					Match
				</Button>
				<Button
					class={`outline ${displaySymbol ? 'selected' : ''}`}
					disabled={displayOriginal}
					onclick={() => (displaySymbol = !displaySymbol)}>
					Symbols
				</Button>
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.ingredients {
		ul {
			padding-left: 0;
		}
	}
	.default {
		margin: 0.5rem 0;
	}

	.segmented {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.25rem;
		margin-bottom: 0.75rem;

		:global(button) {
			width: 100%;
			margin: 0;
		}
	}

	.segmented :global(button.selected),
	.toggle-row :global(button.selected) {
		background-color: var(--pico-primary);
		color: var(--pico-primary-inverse);
	}
	.segmented :global(button.orig) {
		border: 1px solid var(--pico-contrast);
		box-shadow: 0 0 0 1px var(--pico-primary);
	}

	.toggle-row {
		display: flex;
		flex-wrap: nowrap;
		gap: 0.25rem;

		:global(button) {
			flex: 1 1 0;
			margin: 0;
		}
	}

	.legend {
		margin: 1rem 0;
		color: var(--pico-muted-color);
		font-size: 0.85rem;
	}
</style>
