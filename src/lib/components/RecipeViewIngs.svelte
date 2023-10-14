<script>
	import Scale from '$lib/components/Scale.svelte'
	import RecipeViewDropdown from './RecipeViewDropdown.svelte'
	import RecipeViewIngAdmin from './RecipeViewIngAdmin.svelte'
	import RecipeViewExtra from './RecipeViewExtra.svelte'
	import RecipeViewIng from './RecipeViewIng.svelte'

	export let ingredients
	export let sanitizedIngredients
	export let scale
	export let scaledServings
	export let selectedSystem
	export let measurementSystem
	export let userIsAdmin = false

	let displayExtra = false
	let displayDryMatch = false
	let displayOriginal = false
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
			<p><Scale bind:scale /></p>
		{/if}
	{/if}
	<div class="ingredients">
		{#if sanitizedIngredients.some((item) => item.additional)}
			<RecipeViewExtra bind:displayExtra />
		{/if}
		{#if sanitizedIngredients.some((item) => item.dryIngredient) && userIsAdmin}
			<RecipeViewIngAdmin bind:displayDryMatch bind:displayOriginal />
		{/if}
		<ul>
			{#each sanitizedIngredients as ingredient}
				<RecipeViewIng
					{ingredient}
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
			<RecipeViewDropdown bind:selectedSystem {measurementSystem} />
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
