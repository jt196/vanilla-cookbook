<script>
	import RecipeCard from '$lib/components/RecipeCard.svelte'
	import VirtualList from 'svelte-virtual-list'

	/** @type {{filteredRecipes?: any, useVirtualList?: boolean, data: any, recipeRatingChanged?: (uid: string, rating: number) => void}}}} */
	let {
		filteredRecipes = [],
		useVirtualList = true,
		data,
		recipeFavourited,
		recipeRatingChanged
	} = $props()

	let start = $state()
	let end = $state()
</script>

<div class="container">
	{#if useVirtualList}
		<VirtualList items={filteredRecipes} bind:start bind:end>
			{#snippet children({ item })}
				<RecipeCard {item} {data} {recipeFavourited} {recipeRatingChanged} />
			{/snippet}
		</VirtualList>
		<span class="list-indicator">
			<p>Displaying Recipes {start}-{end}</p>
		</span>
	{:else}
		{#each filteredRecipes as item, i (item.uid)}
			<RecipeCard {item} {data} {recipeFavourited} {recipeRatingChanged} />
		{/each}
	{/if}
</div>

<style lang="scss">
	.container {
		min-height: 200px;
		height: calc(100vh - 11em);
		@media (max-width: 1023px) {
			padding: 0;
		}
	}

	.list-indicator {
		display: flex;
		justify-content: center;
		padding: 0.5rem;
	}
</style>
