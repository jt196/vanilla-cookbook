<script>
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'

	/** @type {{mainPhoto: any, recipe: any}} */
	let { mainPhoto, recipe } = $props()
</script>

<div>
	{#if mainPhoto}
		<img
			src="/api/recipe/image/{mainPhoto.id}"
			alt="{recipe.name} photo"
			class="w-full h-auto max-h-[400px] md:max-h-[400px] max-md:max-h-[250px] object-cover block rounded-2xl" />
	{:else if recipe.image_url}
		<img
			src={recipe.image_url}
			alt="{recipe.name} photo"
			class="w-full h-auto max-h-[400px] md:max-h-[400px] max-md:max-h-[250px] object-cover block rounded-2xl" />
	{/if}
</div>
