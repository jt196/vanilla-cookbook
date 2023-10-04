<script>
	import Scale from '$lib/components/Scale.svelte'
	import RecipeViewDropdown from './RecipeViewDropdown.svelte'
	import RecipeViewDryMatch from './RecipeViewDryMatch.svelte'
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
</script>

<div class="ing-div">
	<div class="ing-header">
		<h3>Ingredients</h3>
	</div>
	{#if ingredients}
		{#if scaledServings}
			<p>Servings: {scaledServings}</p>
		{/if}
		<p><Scale bind:scale /></p>
	{/if}
	<div class="ingredients">
		{#if sanitizedIngredients.some((item) => item.additional)}
			<RecipeViewExtra bind:displayExtra />
		{/if}
		{#if sanitizedIngredients.some((item) => item.dryIngredient) && userIsAdmin}
			<RecipeViewDryMatch bind:displayDryMatch />
		{/if}
		<ul>
			{#each sanitizedIngredients as ingredient}
				<RecipeViewIng {ingredient} {scale} {displayExtra} {displayDryMatch} />
			{/each}
		</ul>
	</div>
	<div class="convert">
		<RecipeViewDropdown bind:selectedSystem {measurementSystem} />
	</div>
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
