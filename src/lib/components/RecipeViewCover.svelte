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
		flex: 1; // Normal flex behavior above 768px
		margin-bottom: 1rem;

		img {
			height: 100%; // Maintain height
			max-height: 400px; // Limit max height
			width: auto; // Maintain aspect ratio
			object-fit: cover;
			display: block;
		}

		@media (max-width: 768px) {
			height: 250px; // Fixed height to crop
			overflow: hidden; // Hide overflow

			img {
				width: 100%; // Fill full width
				height: 250px; // Maintain cropping behavior
			}
		}
	}
</style>
