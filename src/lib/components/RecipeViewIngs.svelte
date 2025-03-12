<script>
	import Scale from '$lib/components/Scale.svelte'
	import RecipeViewDropdown from './RecipeViewDropdown.svelte'
	import RecipeViewIng from './RecipeViewIng.svelte'

	/** @type {{ingredients: any, sanitizedIngredients: any, scale: any, scaledServings: any, selectedSystem: any, measurementSystem: any, recipeUid: any, userIsAdmin?: boolean}} */
	let {
		ingredients,
		sanitizedIngredients,
		onScaleChange,
		onSelectedSystemChange,
		measurementSystem,
		recipeUid,
		scale,
		selectedSystem
	} = $props()

	let displayExtra = $state(false)
	let displayDryMatch = $state(false)
	let displayOriginal = $state(false)
</script>

<div class="ing-div">
	<div class="ing-header">
		<h3>Ingredients</h3>
	</div>

	{#if ingredients}
		{#if sanitizedIngredients.some((item) => item.ingredient)}
			<p>
				<Scale {scale} {onScaleChange} />
			</p>
		{/if}
	{/if}

	<div class="ingredients">
		<div class="convert">
			{#if measurementSystem}
				<RecipeViewDropdown {selectedSystem} {onSelectedSystemChange} {measurementSystem} />
			{/if}
		</div>
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
		<div class="ing-settings">
			<div class="checks">
				<fieldset>
					{#if sanitizedIngredients.some((item) => item.additional)}
						<label data-tooltip="Display extra ingredient text">
							<input type="checkbox" bind:checked={displayExtra} />
							Extra
						</label>
					{/if}
					{#if sanitizedIngredients.some((item) => item.dryIngredient)}
						<label data-tooltip="When converting from/to cups, display matched ingredients">
							<input type="checkbox" bind:checked={displayDryMatch} />
							Cup Match
						</label>
						<label data-tooltip="Display original ingredient text">
							<input type="checkbox" bind:checked={displayOriginal} />
							Original
						</label>
					{/if}
				</fieldset>
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
</style>
