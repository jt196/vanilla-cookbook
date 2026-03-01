<script>
	let showPrimaryPhoto = $state(true)
	let showImageUrl = $state(true)

	/** @type {{ recipe: { uid: string, name: string, photos?: Array<{id: string}>, image_url?: string }, width?: string }} */
	let { recipe, width = 'w-36 md:w-48' } = $props()

	$effect(() => {
		const _id = recipe?.photos?.[0]?.id
		const _url = recipe?.image_url
		showPrimaryPhoto = true
		showImageUrl = true
	})
</script>

<a
	href="/recipe/{recipe.uid}/view"
	class="flex flex-col gap-2 no-underline text-current hover:opacity-80 transition-opacity {width}">
	<div class="aspect-square w-full overflow-hidden rounded-lg bg-base-300">
		{#if recipe.photos && recipe.photos.length > 0 && showPrimaryPhoto}
			<img
				class="h-full w-full object-cover"
				loading="lazy"
				src="/api/recipe/image/{recipe.photos[0].id}"
				alt="{recipe.name} thumbnail"
				onerror={() => (showPrimaryPhoto = false)} />
		{:else if recipe.image_url && showImageUrl}
			<img
				class="h-full w-full object-cover"
				loading="lazy"
				src={recipe.image_url}
				alt="{recipe.name} thumbnail"
				onerror={() => (showImageUrl = false)} />
		{/if}
	</div>
	<p class="text-sm font-medium leading-snug line-clamp-2">{recipe.name}</p>
</a>
