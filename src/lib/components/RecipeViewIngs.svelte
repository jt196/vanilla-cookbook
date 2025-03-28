<script>
	import Scale from '$lib/components/Scale.svelte'
	import RecipeViewDropdown from './RecipeViewDropdown.svelte'
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
	let displayDryMatch = $state(user.ingMatch)
	let displayOriginal = $state(user.ingOriginal)

	// Check if any of the ingredients have a default density
	let hasDefaultDensity = $derived(sanitizedIngredients.some((i) => i.usedDefaultDensity === true))
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
				{displayDryMatch}
				{displayOriginal}
				{selectedSystem} />
		{/each}
	</ul>
	{#if hasDefaultDensity}
		<div class="default"><i> * Converted using default water density </i></div>
	{/if}
	<div class="convert">
		{#if measurementSystem && measurementSystem.system != 'inconclusive'}
			<RecipeViewDropdown {selectedSystem} {onSelectedSystemChange} {measurementSystem} />
		{/if}
	</div>
	<div class="ing-settings">
		<div class="checks">
			<fieldset>
				{#if sanitizedIngredients.some((item) => item.additional) && !displayOriginal}
					<label data-tooltip="Display extra ingredient text">
						<input type="checkbox" bind:checked={displayExtra} />
						Extra
					</label>
				{/if}
				{#if sanitizedIngredients.some((item) => item.dryIngredient) && !displayOriginal}
					<label data-tooltip="When converting from/to cups, display matched ingredients">
						<input type="checkbox" bind:checked={displayDryMatch} />
						Cup Match
					</label>
				{/if}
				<label data-tooltip="Display original ingredient text">
					<input type="checkbox" bind:checked={displayOriginal} />
					Original
				</label>
			</fieldset>
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
		margin-bottom: 1rem;
	}
</style>
