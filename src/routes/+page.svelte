<script>
	import Carousel from '$lib/components/ui/Carousel.svelte'
	import CarouselItem from '$lib/components/ui/CarouselItem.svelte'
	import RecipePhotoCard from '$lib/components/recipe/RecipePhotoCard.svelte'

	/** @type {{data: any}} */
	let { data } = $props()
	const { highlights } = data

	const rows = [
		{ label: 'Recently Added', recipes: highlights.recentlyAdded },
		{ label: 'Recently Cooked', recipes: highlights.recentlyCooked },
		{ label: 'Most Cooked', recipes: highlights.mostCooked },
		{ label: 'Favourites', recipes: highlights.favourites },
		{ label: 'Random Picks', recipes: highlights.random }
	].filter((row) => row.recipes.length > 0)
</script>

{#if rows.length === 0}
	<div class="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-base-content/50">
		<p class="text-xl">Nothing here yet — add some recipes to get started!</p>
		<a href="/recipe/new" class="btn btn-primary">Add your first recipe</a>
	</div>
{:else}
	<div class="flex flex-col gap-10">
		{#each rows as row (row.label)}
			<section>
				<h2 class="text-lg font-semibold mb-3">{row.label}</h2>
				<Carousel>
					{#each row.recipes as recipe (recipe.uid)}
						<CarouselItem>
							<RecipePhotoCard {recipe} />
						</CarouselItem>
					{/each}
				</Carousel>
			</section>
		{/each}
	</div>
{/if}
