<!-- RecipeCard.svelte -->
<script>
	import Favourite from '$lib/components/svg/Favourite.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import StarRating from '$lib/components/StarRating.svelte'
	import { changeRecipeFavourite } from '$lib/utils/crud'
	import Card from '$lib/components/ui/Card.svelte'

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

<a
	href="/recipe/{item.uid}/view/"
	class="flex items-stretch gap-3 mb-3 rounded-lg transition no-underline text-current">
	<Card class="flex-1 hover:bg-base-200 min-h-[9rem]" size="md" side>
		{#snippet figure()}
			<div class="w-32 h-[9rem] overflow-hidden">
				{#if item.photos && item.photos.length > 0}
					<img
						class="h-full w-full object-cover"
						loading="lazy"
						src="/api/recipe/image/{item.photos[0].id}"
						alt="{item.name} thumbnail" />
				{:else if item.image_url}
					<img
						class="h-full w-full object-cover"
						loading="lazy"
						src={item.image_url}
						alt="{item.name} thumbnail" />
				{:else}
					<div class="h-full w-full bg-base-300" aria-hidden="true"></div>
				{/if}
			</div>
		{/snippet}

		{#snippet title()}
			<div class="flex items-start justify-between gap-2 w-full">
				<span class="text-base md:text-2xl leading-snug line-clamp-2">{item.name}</span>
				{#if item.userId === data.user?.requestedUserId}
					<div class="flex gap-1 shrink-0">
						<button
							onclick={(event) => handleFavourite(item?.uid, event)}
							class="btn btn-circle btn-ghost btn-xs tooltip opacity-60 hover:opacity-100"
							data-tip="Favourite Recipe"
							class:text-error={favourite}
							class:opacity-100={favourite}>
							<Favourite {favourite} width="16px" height="16px" />
						</button>
						<button
							class="btn btn-circle btn-ghost btn-xs tooltip opacity-60 hover:opacity-100"
							class:text-success={logged}
							class:opacity-100={logged}
							data-tip={item.log?.length > 0
								? `Cooked ${item.log.length} time${item.log.length > 1 ? 's' : ''}`
								: 'Never cooked'}>
							<Check checked={logged} width="16px" height="16px" />
						</button>
					</div>
				{/if}
			</div>
		{/snippet}

		{#snippet children()}
			<StarRating
				rating={item.rating}
				editable={true}
				ratingChanged={(newRating) => recipeRatingChanged?.(item.uid, newRating)} />
		{/snippet}
	</Card>
</a>
