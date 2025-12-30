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

<div class="min-h-[200px] h-[calc(100vh-11em)] max-lg:p-0">
	{#if useVirtualList}
		<VirtualList items={filteredRecipes} bind:start bind:end>
			{#snippet children({ item })}
				<RecipeCard {item} {data} {recipeFavourited} {recipeRatingChanged} />
			{/snippet}
		</VirtualList>
		<div class="flex justify-center p-2">
			<p class="text-sm text-base-content/70">Displaying Recipes {start}-{end}</p>
		</div>
	{:else}
		{#each filteredRecipes as item, i (item.uid)}
			<RecipeCard {item} {data} {recipeFavourited} {recipeRatingChanged} />
		{/each}
	{/if}
</div>
