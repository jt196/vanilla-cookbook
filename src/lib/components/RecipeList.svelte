<script>
	import RecipeCard from '$lib/components/RecipeCard.svelte'
	import VirtualList from 'svelte-virtual-list'
	import { createEventDispatcher } from 'svelte'

	export let filteredRecipes = []
	export let useVirtualList = true
	export let data

	const dispatch = createEventDispatcher()

	let start
	let end
</script>

<div class="container">
	{#if useVirtualList}
		<VirtualList items={filteredRecipes} bind:start bind:end let:item>
			<RecipeCard {item} {data} on:recipeDeleted={(e) => dispatch('recipeDeleted', e.detail)} />
		</VirtualList>
		<p>showing items {start}-{end}</p>
	{:else}
		<!-- for testing purposes only -->
		{#each filteredRecipes as item (item.uid)}
			<RecipeCard {item} {data} on:recipeDeleted={(e) => dispatch('recipeDeleted', e.detail)} />
		{/each}
	{/if}
</div>

<style lang="scss">
	.container {
		min-height: 200px;
		height: calc(100vh - 18em);
	}
</style>
