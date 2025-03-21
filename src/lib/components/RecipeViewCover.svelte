<script>
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'

	/** @type {{mainPhoto: any, recipe: any}} */
	let { mainPhoto, recipe } = $props()
</script>

<div class="recipe-cover">
	{#if mainPhoto}
		<img src="/api/recipe/image/{mainPhoto.id}" alt="{recipe.name} photo" />
	{:else if recipe.image_url}
		<img src={recipe.image_url} alt="{recipe.name} photo" />
	{/if}
</div>

<style lang="scss">
	.recipe-cover {
		img {
			width: 100%; // Maintain height
			max-height: 400px; // Limit max height
			height: auto; // Maintain aspect ratio
			object-fit: cover;
			display: block;
			border-radius: 1rem;
		}

		@media (max-width: 768px) {
			img {
				max-height: 250px;
			}
		}
	}
</style>
