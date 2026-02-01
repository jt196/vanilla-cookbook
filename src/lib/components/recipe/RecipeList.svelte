<script>
	import RecipeCard from '$lib/components/recipe/RecipeCard.svelte'
	import VirtualList from 'svelte-virtual-list'

	/** @type {{filteredRecipes?: any, useVirtualList?: boolean, viewMode?: 'owner' | 'social', viewerUserId?: string | null, recipeRatingChanged?: (uid: string, rating: number) => void, recipeFavourited?: (uid: string) => void, recipeDuplicated?: (uid: string) => void}}}} */
	let {
		filteredRecipes = [],
		useVirtualList = true,
		viewMode = 'owner',
		viewerUserId = null,
		recipeFavourited,
		recipeRatingChanged,
		recipeDuplicated
	} = $props()

	let start = $state()
	let end = $state()
</script>

<div class="min-h-[200px] h-[calc(100vh-11em)] max-lg:p-0">
	{#if useVirtualList}
		<VirtualList items={filteredRecipes} bind:start bind:end>
			{#snippet children({ item })}
				<RecipeCard
					{item}
					{viewMode}
					{viewerUserId}
					{recipeFavourited}
					{recipeRatingChanged}
					{recipeDuplicated} />
			{/snippet}
		</VirtualList>
		<div class="flex justify-center p-2">
			<p class="text-sm text-base-content/70">Displaying Recipes {start}-{end}</p>
		</div>
	{:else}
		{#each filteredRecipes as item, i (item.uid)}
			<RecipeCard
				{item}
				{viewMode}
				{viewerUserId}
				{recipeFavourited}
				{recipeRatingChanged}
				{recipeDuplicated} />
		{/each}
	{/if}
</div>
