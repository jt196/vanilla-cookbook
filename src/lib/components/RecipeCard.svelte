<!-- RecipeCard.svelte -->
<script>
	import Favourite from '$lib/components/svg/Favourite.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import StarRating from '$lib/components/StarRating.svelte'
	import { changeRecipeFavourite } from '$lib/utils/crud'

	/** @type {{item: any, data: any, recipeFavourited?: (uid: string) => void, recipeRatingChanged?: (uid: string, rating: number) => void}}, */
	let { item, data, recipeFavourited, recipeRatingChanged } = $props()

	let logged = $derived(item.log?.length > 0)
	let favourite = $derived(item?.on_favorites)

	async function handleFavourite(uid, event) {
		event.preventDefault()
		event.stopPropagation()
		console.log('Handle favourite button clicked for uid: ' + uid)
		const success = await changeRecipeFavourite(uid)
		if (success && recipeFavourited) {
			recipeFavourited(uid)
		}
	}
</script>

<a href="/recipe/{item.uid}/view/" class="flex items-center justify-between mb-2 rounded-lg transition-colors no-underline text-current">
	<article class="card bg-base-100 hover:bg-base-200 shadow-md flex-1 min-h-25 py-4 px-4 mr-2">
		<h3 class="card-title text-xl md:text-2xl truncate max-sm:whitespace-normal max-sm:overflow-visible">
			{item.name}
		</h3>
		<div class="flex items-center gap-4 mt-2">
			<StarRating
				rating={item.rating}
				editable={true}
				ratingChanged={(newRating) => recipeRatingChanged?.(item.uid, newRating)} />
			{#if item.userId === data.user?.requestedUserId}
				<div class="flex gap-2">
					<button
						onclick={(event) => handleFavourite(item?.uid, event)}
						class="btn btn-circle btn-ghost btn-sm tooltip opacity-60 hover:opacity-100"
						data-tip="Favourite Recipe"
						class:text-error={favourite}
						class:opacity-100={favourite}>
						<Favourite
							{favourite}
							width="18px"
							height="18px"
							fill="currentColor" />
					</button>
					<button
						class="btn btn-circle btn-ghost btn-sm tooltip opacity-60 hover:opacity-100"
						class:text-success={logged}
						class:opacity-100={logged}
						data-tip={item.log?.length > 0
							? `Cooked ${item.log.length} time${item.log.length > 1 ? 's' : ''}`
							: 'Never cooked'}>
						<Check
							checked={logged}
							width="18px"
							height="18px"
							fill="currentColor" />
					</button>
				</div>
			{/if}
		</div>
	</article>
	<div class="flex justify-center items-center shrink-0">
		{#if item.photos && item.photos.length > 0}
			<img
				class="w-25 h-25 object-cover rounded-lg"
				loading="lazy"
				src="/api/recipe/image/{item.photos[0].id}"
				alt="{item.name} thumbnail" />
		{:else if item.image_url}
			<img
				class="w-25 h-25 object-cover rounded-lg"
				loading="lazy"
				src={item.image_url}
				alt="{item.name} thumbnail" />
		{/if}
	</div>
</a>
