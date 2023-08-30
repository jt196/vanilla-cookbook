<script>
	import RecipeCard from '$lib/components/RecipeCard.svelte'
	import VirtualList from 'svelte-virtual-list'

	export let filteredRecipes = []
	export let useVirtualList = true
	export let data

	let start
	let end
</script>

<div class="container">
	{#if useVirtualList}
		<VirtualList items={filteredRecipes} bind:start bind:end let:item>
			<RecipeCard {item} {data} />
		</VirtualList>
		<p>showing items {start}-{end}</p>
	{:else}
		{#each filteredRecipes as item (item.uid)}
			<RecipeCard {item} {data} />
		{/each}
	{/if}
</div>

<style lang="scss">
	.container {
		min-height: 200px;
		height: calc(100vh - 18em);
	}
	.recipe-thumbnail {
		width: 100px;
		height: auto;
		object-fit: cover;
		display: block;
	}

	.grid {
		display: grid;
		grid-template-columns: 100px 3fr 1fr; // 100px for the image, 3 parts for the recipe card, and 1 part for the buttons
		gap: 1rem; // Spacing between grid items
	}

	.recipe-card {
		grid-column: 2;
		text-decoration: none;
		color: inherit;
	}

	.recipe-buttons {
		grid-column: 3;
		padding: 0.2rem;
		display: flex;
		justify-content: flex-end; // Aligns the buttons to the right side
		align-items: center; // Vertically centers the buttons if the container has a height
		gap: 0.5rem; // Adds spacing between the buttons
		button {
			margin-bottom: 0;
		}
	}

	article {
		transition: background-color 0.2s ease;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	article:hover {
		background-color: var(--pico-secondary-focus);
	}
</style>
