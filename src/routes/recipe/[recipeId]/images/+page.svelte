<script>
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'

	/**
	 * Data for the current page.
	 * @type {PageData}
	 */
	export let data

	let { recipe } = data
	console.log('🚀 ~ file: +page.svelte:11 ~ recipe:', recipe)

	const otherPhotos = (recipe.photos || [])
		.filter((photo) => photo.url === null)
		.sort((a, b) => (b.mainPhoto || 0) - (a.mainPhoto || 0))

	console.log(otherPhotos)
</script>

<h3>{recipe?.name}</h3>

<div class="grid">
	<div>
		{#if otherPhotos.length > 0}
			<div class="other-photos">
				{#each otherPhotos as photo (photo.id)}
					<img src="/recipe_photos/{photo.id}.{photo.fileType}" alt="{recipe.name} photo" />
				{/each}
			</div>
		{:else}
			No saved photos!
			<FoodBowl width="100%" />
		{/if}
	</div>
</div>

<style lang="scss">
	img {
		width: 100%; /* Set to your desired height */
		height: auto; /* This will ensure the width remains proportional */
		object-fit: cover;
		display: block; /* To remove any default spacing at the bottom of images */
		margin-bottom: 1rem;
	}
</style>
