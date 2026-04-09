<!-- RecipeCard.svelte -->
<script>
	import Favourite from '$lib/components/svg/Favourite.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import Fork from '$lib/components/svg/Fork.svelte'
	import StarRating from '$lib/components/ui/StarRating.svelte'
	import { changeRecipeFavourite } from '$lib/utils/crud'
	import Card from '$lib/components/ui/Card.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { t } from '$lib/stores/locale.js'
	let showPrimaryPhoto = $state(true)
	let showImageUrl = $state(true)

	/** @type {{item: any, viewMode?: 'owner' | 'social', viewerUserId?: string | null, recipeFavourited?: (uid: string, nextState: boolean, recipe: any) => void, recipeRatingChanged?: (uid: string, rating: number) => void, onDuplicate?: (uid: string, event: Event) => void}}, */
	let {
		item,
		viewMode = 'owner',
		viewerUserId = null,
		recipeFavourited,
		recipeRatingChanged,
		onDuplicate
	} = $props()

	let logged = $derived(item.log?.length > 0)
	let favourite = $derived(item?.on_favorites)
	const lastCookedDate = $derived(
		item.log?.length
			? new Date(Math.max(...item.log.map((l) => new Date(l.cooked).getTime())))
			: null
	)
	let loadingFav = $state(false)
	const isOwnerView = $derived(viewMode === 'owner' && item.userId === viewerUserId)
	const canFavourite = $derived(!!viewerUserId)
	const canDuplicate = $derived(
		!!viewerUserId &&
			item.userId !== viewerUserId &&
			!item.parentRecipeId &&
			!item.duplicatedByViewer
	)

	// Reset image visibility when the recipe changes
	$effect(() => {
		void item.photos?.[0]?.id
		void item.image_url
		showPrimaryPhoto = true
		showImageUrl = true
	})

	async function handleFavourite(uid, event) {
		event.preventDefault()
		event.stopPropagation()
		if (!canFavourite) return
		loadingFav = true
		const success = await changeRecipeFavourite(uid)
		loadingFav = false
		if (success && recipeFavourited) {
			recipeFavourited(uid, !favourite, item)
		}
	}

	function handleDuplicate(uid, event) {
		event.preventDefault()
		event.stopPropagation()
		if (!canDuplicate) return
		onDuplicate?.(uid, event)
	}
</script>

<a
	href="/recipe/{item.uid}/view/"
	class="flex items-stretch gap-3 mb-2 md:mb-3 rounded-lg transition no-underline text-current">
	<Card
		class="flex-1 hover:bg-base-200 min-h-24 md:min-h-36"
		size="md"
		side
		bodyClass="p-2 md:p-6 justify-center"
		figureClass="w-32 flex-shrink-0">
		{#snippet figure()}
			<div class="h-24 md:h-36 w-full overflow-hidden">
				{#if item.photos && item.photos.length > 0 && showPrimaryPhoto}
					<img
						class="h-full w-full object-cover"
						loading="lazy"
						src="/api/recipe/image/{item.photos[0].id}"
						alt={$t('recipeCard.thumbnail', { name: item.name })}
						onerror={() => (showPrimaryPhoto = false)} />
				{:else if item.image_url && showImageUrl}
					<img
						class="h-full w-full object-cover"
						loading="lazy"
						src={item.image_url}
						alt={$t('recipeCard.thumbnail', { name: item.name })}
						onerror={() => (showImageUrl = false)} />
				{:else}
					<div class="h-full w-full bg-base-300" aria-hidden="true"></div>
				{/if}
			</div>
		{/snippet}

		{#snippet title()}
			<div class="flex items-start justify-between gap-2 w-full">
				<span class="text-base md:text-2xl leading-snug line-clamp-2 md:text-left">
					{item.name}
				</span>
				{#if viewerUserId}
					<div class="flex gap-1 shrink-0">
						{#if canFavourite}
							<Button
								onclick={(event) => handleFavourite(item?.uid, event)}
								style="ghost"
								size="xs"
								disabled={loadingFav}
								class="btn-circle tooltip hover:opacity-100 {favourite
									? 'text-error opacity-100'
									: ''}"
								data-tip={$t('recipeCard.favouriteRecipe')}>
								{#if loadingFav}
									<span class="loading loading-spinner loading-xs"></span>
								{:else}
									<Favourite {favourite} width="16px" height="16px" />
								{/if}
							</Button>
						{/if}
						{#if isOwnerView}
							<Button
								style="ghost"
								size="xs"
								class="btn-circle tooltip hover:opacity-100 {logged
									? 'text-success opacity-100'
									: ''}"
								data-tip={item.log?.length > 0
									? $t(item.log.length === 1 ? 'recipe.cookedTimes_one' : 'recipe.cookedTimes_other', { count: item.log.length })
									: $t('recipe.neverCooked')}>
								{#if item.log?.length > 1}
									<span class="badge badge-success badge-xs text-success-content font-bold min-w-5"
										>{item.log.length}</span>
								{:else}
									<Check checked={logged} width="16px" height="16px" />
								{/if}
							</Button>
						{:else if canDuplicate}
							<Button
								style="ghost"
								size="xs"
								class="btn-circle tooltip hover:opacity-100"
								data-tip={$t('recipeCard.forkRecipe')}
								onclick={(event) => handleDuplicate(item?.uid, event)}>
								<Fork width="16px" height="16px" />
							</Button>
						{:else if viewMode === 'social' && viewerUserId && item.userId !== viewerUserId}
							<Button
								style="ghost"
								size="xs"
								disabled={true}
								class="btn-circle tooltip opacity-40"
								data-tip={$t('recipeCard.alreadyForked')}>
								<Fork width="16px" height="16px" />
							</Button>
						{/if}
					</div>
				{/if}
			</div>
		{/snippet}

		{#snippet children()}
			{#if isOwnerView}
				<div class="hidden md:block">
					<StarRating
						rating={item.rating}
						editable={true}
						ratingChanged={(newRating) => recipeRatingChanged?.(item.uid, newRating)} />
				</div>
				{#if lastCookedDate}
					<p class="text-xs text-base-content/50 hidden md:block">
						{$t('recipe.lastCooked')} {lastCookedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
					</p>
				{/if}
			{:else}
				<p class="text-sm text-base-content/70 md:text-left">
					{$t('common.by')}
					{#if viewerUserId && item.userId === viewerUserId}
						<a href="/user/{viewerUserId}/recipes" class="link link-primary font-medium">{$t('common.me')}</a>
					{:else}
						<a href="/user/{item.userId}/recipes" class="link link-primary">
							{item.auth_user?.username ?? 'Unknown'}
						</a>
					{/if}
				</p>
			{/if}
		{/snippet}
	</Card>
</a>
