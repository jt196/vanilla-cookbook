<!-- RecipeCard.svelte -->
<script>
	import Favourite from '$lib/components/svg/Favourite.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import StarRating from '$lib/components/StarRating.svelte'
	import { changeRecipeFavourite } from '$lib/utils/crud'
	import Card from '$lib/components/ui/Card.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	let showPrimaryPhoto = $state(true)
	let showImageUrl = $state(true)

	/** @type {{item: any, data: any, recipeFavourited?: (uid: string) => void, recipeRatingChanged?: (uid: string, rating: number) => void}}, */
	let { item, data, recipeFavourited, recipeRatingChanged } = $props()

	let logged = $derived(item.log?.length > 0)
	let favourite = $derived(item?.on_favorites)

	// Reset image visibility when the recipe changes
	$effect(() => {
		const _primaryId = item.photos?.[0]?.id
		const _imageUrl = item.image_url
		showPrimaryPhoto = true
		showImageUrl = true
	})

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
	<Card class="flex-1 hover:bg-base-200 min-h-36" size="md" side figureClass="w-32 flex-shrink-0">
		{#snippet figure()}
			<div class="h-36 w-full overflow-hidden">
				{#if item.photos && item.photos.length > 0 && showPrimaryPhoto}
					<img
						class="h-full w-full object-cover"
						loading="lazy"
						src="/api/recipe/image/{item.photos[0].id}"
						alt="{item.name} thumbnail"
						onerror={() => (showPrimaryPhoto = false)} />
				{:else if item.image_url && showImageUrl}
					<img
						class="h-full w-full object-cover"
						loading="lazy"
						src={item.image_url}
						alt="{item.name} thumbnail"
						onerror={() => (showImageUrl = false)} />
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
						<Button
							onclick={(event) => handleFavourite(item?.uid, event)}
							style="ghost"
							size="xs"
							class="btn-circle tooltip hover:opacity-100 {favourite ? 'text-error opacity-100' : ''}"
							data-tip="Favourite Recipe">
							<Favourite {favourite} width="16px" height="16px" />
						</Button>
						<Button
							style="ghost"
							size="xs"
							class="btn-circle tooltip hover:opacity-100 {logged ? 'text-success opacity-100' : ''}"
							data-tip={item.log?.length > 0
								? `Cooked ${item.log.length} time${item.log.length > 1 ? 's' : ''}`
								: 'Never cooked'}>
							<Check checked={logged} width="16px" height="16px" />
						</Button>
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
