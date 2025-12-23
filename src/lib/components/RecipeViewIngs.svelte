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

	const originalSystem = $derived(measurementSystem?.system || null)

	$effect(() => {
		if (measurementSystem) {
			console.log('measurementSystem:', measurementSystem)
		}
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
	{#if sanitizedIngredients.some((i) => i.optional || i.approx || i.toServe || i.toTaste)}
		<div class="legend">
			<span class="badge">~</span> approx
			<span class="badge">opt</span> optional
			<span class="badge">srv</span>to serve
			<span class="badge">tt</span> to taste
		</div>
	{/if}
	<div class="convert">
		<div class="segmented">
			<button
				class:selected={selectedSystem === 'metric'}
				class:orig={originalSystem === 'metric'}
				onclick={() => onSelectedSystemChange('metric')}>
				Metric
			</button>
			<button
				class:selected={selectedSystem === 'americanVolumetric'}
				class:orig={originalSystem === 'americanVolumetric'}
				onclick={() => onSelectedSystemChange('americanVolumetric')}>
				US Vol
			</button>
			<button
				class:selected={selectedSystem === 'imperial'}
				class:orig={originalSystem === 'imperial'}
				onclick={() => onSelectedSystemChange('imperial')}>
				Imperial
			</button>
		</div>
	</div>
	<div class="ing-settings">
		<div class="checks">
			<div class="toggle-row">
				<button
					class:selected={displayOriginal}
					onclick={() => (displayOriginal = !displayOriginal)}>
					Original
				</button>
				{#if sanitizedIngredients.some((item) => item.additional)}
					<button
						class:selected={displayExtra}
						disabled={displayOriginal}
						onclick={() => (displayExtra = !displayExtra)}>
						Extra
					</button>
				{/if}
				{#if sanitizedIngredients.some((item) => item.dryIngredient)}
					<button
						class:selected={displayDryMatch}
						disabled={displayOriginal}
						onclick={() => (displayDryMatch = !displayDryMatch)}>
						Match
					</button>
				{/if}
				<button
					class:selected={displaySymbol}
					disabled={displayOriginal}
					onclick={() => (displaySymbol = !displaySymbol)}>
					Symbols
				</button>
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

		button {
			width: 100%;
		}
	}

	.segmented button.selected,
	.toggle-row button.selected {
		background-color: var(--pico-primary);
		color: var(--pico-primary-inverse);
	}
	.segmented button.orig {
		border: 2px solid var(--pico-primary);
		box-shadow: 0 0 0 1px var(--pico-primary);
	}

	.toggle-row {
		display: flex;
		flex-wrap: nowrap;
		gap: 0.25rem;

		button {
			flex: 1 1 0;
		}
	}

	.legend {
		margin: 0.5rem 0;
		color: var(--pico-muted-color);
		font-size: 0.85rem;
	}
</style>
