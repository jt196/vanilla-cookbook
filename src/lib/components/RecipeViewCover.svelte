<script>
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'

	export let mainPhoto
	export let recipe
</script>

<div class="recipe-cover">
	{#if mainPhoto}
		<img
			src={mainPhoto.url && !mainPhoto.fileType
				? mainPhoto.url
				: `/api/recipe/image/${mainPhoto.id}`}
			alt="{recipe.name} photo" />
	{:else}
		<FoodBowl height="400px" />
	{/if}
</div>

<style lang="scss">
	.recipe-cover {
		img {
			height: 100%; /* Set to your desired height */
			max-height: 400px;
			width: auto; /* This will ensure the width remains proportional */
			object-fit: cover;
			display: block; /* To remove any default spacing at the bottom of images */
		}
		margin-bottom: 1rem;
		flex: 1;
	}
</style>
