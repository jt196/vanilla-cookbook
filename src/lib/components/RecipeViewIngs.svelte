<script>
	import Scale from '$lib/components/Scale.svelte'
	import RecipeViewDropdown from './RecipeViewDropdown.svelte'
	import RecipeViewIngAdmin from './RecipeViewIngAdmin.svelte'
	import RecipeViewExtra from './RecipeViewExtra.svelte'
	import RecipeViewIng from './RecipeViewIng.svelte'

	/** @type {{ingredients: any, sanitizedIngredients: any, scale: any, scaledServings: any, selectedSystem: any, measurementSystem: any, recipeUid: any, userIsAdmin?: boolean}} */
	let {
		ingredients,
		sanitizedIngredients,
		onScaleChange,
		scaledServings,
		onSelectedSystemChange,
		measurementSystem,
		recipeUid,
		userIsAdmin = false,
		scale,
		selectedSystem
	} = $props()

	let displayExtra = $state(false)
	let displayDryMatch = $state(false)
	let displayOriginal = $state(false)

	// Define callbacks to update these states:
	function handleDisplayDryMatchChange(newVal) {
		displayDryMatch = newVal
	}
	function handleDisplayOriginalChange(newVal) {
		displayOriginal = newVal
	}

	function handleDisplayExtraChange(newVal) {
		displayOriginal = newVal
	}
</script>

<div class="ing-div">
	<div class="ing-header">
		<h3>Ingredients</h3>
	</div>
	{#if ingredients}
		{#if scaledServings}
			<p>Servings: {scaledServings}</p>
		{/if}
		{#if sanitizedIngredients.some((item) => item.ingredient)}
			<p>
				<Scale {scale} {onScaleChange} />
			</p>
		{/if}
	{/if}
	<div class="ingredients">
		{#if sanitizedIngredients.some((item) => item.additional)}
			<RecipeViewExtra onDisplayExtraChange={handleDisplayExtraChange} />
		{/if}
		{#if sanitizedIngredients.some((item) => item.dryIngredient) && userIsAdmin}
			<RecipeViewIngAdmin
				{displayDryMatch}
				{displayOriginal}
				onDisplayDryMatchChange={handleDisplayDryMatchChange}
				onDisplayOriginalChange={handleDisplayOriginalChange} />
		{/if}
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
	</div>
	{#if measurementSystem}
		<div class="convert">
			<RecipeViewDropdown {selectedSystem} {onSelectedSystemChange} {measurementSystem} />
		</div>
	{/if}
</div>

<style lang="scss">
	.convert {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	.ingredients {
		ul {
			padding-left: 0;
		}
	}
</style>
