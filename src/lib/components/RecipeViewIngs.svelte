<script>
	import Scale from '$lib/components/Scale.svelte'
	import RecipeViewIng from './RecipeViewIng.svelte'

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
	const systemLegendMap = {
		metric: '¹ metric',
		imperial: '² imperial',
		americanVolumetric: '³ US Vol'
	}

	let hasDefaultDensity = $derived(sanitizedIngredients.some((i) => i.usedDefaultDensity === true))
	let unitSystemsPresent = $derived.by(() => {
		const set = new Set()
		sanitizedIngredients.forEach((i) => {
			if (i.unitSystem) set.add(i.unitSystem)
		})
		return Array.from(set)
	})
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
	<div class="convert">
		<div class="segmented">
			<button
				class:selected={selectedSystem === 'metric'}
				onclick={() => onSelectedSystemChange('metric')}>
				Metric
			</button>
			<button
				class:selected={selectedSystem === 'americanVolumetric'}
				onclick={() => onSelectedSystemChange('americanVolumetric')}>
				US Vol
			</button>
			<button
				class:selected={selectedSystem === 'imperial'}
				onclick={() => onSelectedSystemChange('imperial')}>
				Imperial
			</button>
		</div>
	</div>
	<div class="ing-settings">
		<div class="checks">
			<div class="toggle-row">
				{#if sanitizedIngredients.some((item) => item.additional) && !displayOriginal}
					<button class:selected={displayExtra} onclick={() => (displayExtra = !displayExtra)}>
						Extra
					</button>
				{/if}
				{#if sanitizedIngredients.some((item) => item.dryIngredient) && !displayOriginal}
					<button class:selected={displayDryMatch} onclick={() => (displayDryMatch = !displayDryMatch)}>
						Cup Match
					</button>
				{/if}
				<button class:selected={displayOriginal} onclick={() => (displayOriginal = !displayOriginal)}>
					Original
				</button>
				{#if !displayOriginal}
					<button class:selected={displaySymbol} onclick={() => (displaySymbol = !displaySymbol)}>
						Symbols
					</button>
				{/if}
			</div>
		</div>
	</div>
	{#if unitSystemsPresent.length > 0}
		<div class="legend">
			{unitSystemsPresent.map((s) => systemLegendMap[s]).filter(Boolean).join(' · ')}
		</div>
	{/if}
</div>

<style lang="scss">
	.ingredients {
		ul {
			padding-left: 0;
		}
	}
	.default {
		margin-bottom: 1rem;
	}

    .segmented {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.25rem;
        margin-bottom: 0.75rem;

        button {
            width: 100%;
        }
    }

    .segmented button.selected,
    .toggle-row button.selected {
        background-color: var(--pico-primary);
        color: var(--pico-primary-inverse);
    }

	.toggle-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;

		button {
			flex: 1 1 150px;
		}
	}

	.legend {
		margin-top: 0.5rem;
		color: var(--pico-muted-color);
		font-size: 0.85rem;
	}
</style>
