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

<div>
	<h3 class="text-2xl font-bold mb-4">Ingredients</h3>

	{#if ingredients.length > 0}
		{#if sanitizedIngredients.some((item) => item.ingredient)}
			<div class="mb-4">
				<Scale {scale} {onScaleChange} />
			</div>
		{/if}
	{:else}
		<p class="text-base-content/70">Loading...</p>
	{/if}

	<ul class="pl-0 mb-4 space-y-1">
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
		<p class="text-sm italic text-base-content/60 my-2">* Converted using default water density</p>
	{/if}

	{#if hasApprox || hasOptional || hasToServe || hasToTaste}
		<div class="flex flex-wrap gap-3 text-sm text-base-content/60 my-4">
			{#if hasApprox}<span
					><Badge color="secondary" style="outline" title="Approximate">~</Badge> approx</span
				>{/if}
			{#if hasOptional}<span
					><Badge color="secondary" style="outline" title="Optional">opt</Badge> optional</span
				>{/if}
			{#if hasToServe}<span
					><Badge color="secondary" style="outline" title="To serve">srv</Badge> to serve</span
				>{/if}
			{#if hasToTaste}<span
					><Badge color="secondary" style="outline" title="To taste">tt</Badge> to taste</span
				>{/if}
		</div>
	{/if}

	<div class="mb-4">
		<div class="grid grid-cols-3 gap-1 mb-3">
			<button
				class="btn btn-sm"
				class:btn-primary={selectedSystem === 'metric'}
				class:btn-soft={selectedSystem !== 'metric'}
				class:ring-2={originalSystem === 'metric'}
				class:ring-primary={originalSystem === 'metric'}
				onclick={() => onSelectedSystemChange('metric')}>
				Metric
			</button>
			<button
				class="btn btn-sm"
				class:btn-primary={selectedSystem === 'americanVolumetric'}
				class:btn-soft={selectedSystem !== 'americanVolumetric'}
				class:ring-2={originalSystem === 'americanVolumetric'}
				class:ring-primary={originalSystem === 'americanVolumetric'}
				onclick={() => onSelectedSystemChange('americanVolumetric')}>
				US Vol
			</button>
			<button
				class="btn btn-sm"
				class:btn-primary={selectedSystem === 'imperial'}
				class:btn-soft={selectedSystem !== 'imperial'}
				class:ring-2={originalSystem === 'imperial'}
				class:ring-primary={originalSystem === 'imperial'}
				onclick={() => onSelectedSystemChange('imperial')}>
				Imperial
			</button>
		</div>
	</div>

	<div class="flex flex-wrap gap-1">
		<button
			class="btn btn-sm flex-1"
			class:btn-primary={displayOriginal}
			class:btn-soft={!displayOriginal}
			onclick={() => (displayOriginal = !displayOriginal)}>
			Original
		</button>
		{#if sanitizedIngredients.some((item) => item.additional)}
			<button
				class="btn btn-sm flex-1"
				class:btn-primary={displayExtra}
				class:btn-soft={!displayExtra}
				disabled={displayOriginal}
				onclick={() => (displayExtra = !displayExtra)}>
				Extra
			</button>
		{/if}
		<button
			class="btn btn-sm flex-1"
			class:btn-primary={displayDryMatch}
			class:btn-soft={!displayDryMatch}
			disabled={displayOriginal || selectedSystem === 'americanVolumetric'}
			onclick={() => (displayDryMatch = !displayDryMatch)}>
			Match
		</button>
		<button
			class="btn btn-sm flex-1"
			class:btn-primary={displaySymbol}
			class:btn-soft={!displaySymbol}
			disabled={displayOriginal}
			onclick={() => (displaySymbol = !displaySymbol)}>
			Symbols
		</button>
	</div>
</div>
