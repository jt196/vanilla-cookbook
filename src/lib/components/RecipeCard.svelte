<!-- RecipeCard.svelte -->
<script>
	import Favourite from '$lib/components/svg/Favourite.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import { localDate } from '$lib/utils/dateTime'
	import StarRating from '$lib/components/StarRating.svelte'
	import { addRecipeToFavourites } from '$lib/utils/crud'

	/** @type {{item: any, data: any, recipeFavourited?: (uid: string) => void, recipeRatingChanged?: (uid: string, rating: number) => void}}, */
	let { item, data, recipeFavourited, recipeRatingChanged } = $props()

	let logged = $derived(item.log?.length > 0)
	let favourite = $derived(item?.on_favorites)

	async function handleFavourite(uid, event) {
		// Preventing the click through to the item view page
		event.preventDefault()
		// Stop the click event from bubbling up to the parent anchor
		event.stopPropagation()
		console.log('Handle favourites button clicked for uid: ' + uid)
		const success = await addRecipeToFavourites(uid)
		if (success && recipeFavourited) {
			recipeFavourited(uid)
		}
	}
</script>

<a href="/recipe/{item.uid}/view/" class="recipe-container">
	<article class="recipe-card">
		<h3>{item.name}</h3>
		<div class="star-fav">
			<div class="stars">
				<StarRating
					rating={item.rating}
					editable={true}
					ratingChanged={(newRating) => recipeRatingChanged?.(item.uid, newRating)} />
			</div>
			{#if item.userId === data.user?.requestedUserId}
				<button
					onclick={(event) => handleFavourite(item?.uid, event)}
					data-tooltip="Favourite Recipe"
					class="card-button outline secondary">
					<Favourite
						{favourite}
						width="15px"
						height="15px"
						fill={favourite ? 'var(--pico-del-color)' : 'var(--pico-secondary-focus)'} />
				</button>
				<button
					class="card-button"
					data-tooltip={item.log?.length > 0
						? 'This recipe has been cooked ' + item.log.length + ' times'
						: 'This recipe has never been cooked'}>
					<Check
						checked={logged}
						width="15px"
						height="15px"
						fill={logged ? 'var(--pico-ins-color)' : 'var(--pico-secondary-focus)'} />
				</button>
			{/if}
		</div>
	</article>
	<div class="recipe-image">
		{#if item.photos && item.photos.length > 0}
			<img
				class="recipe-thumbnail"
				loading="lazy"
				src="/api/recipe/image/{item.photos[0].id}"
				alt="{item.name} thumbnail" />
		{:else if item.image_url}
			<img
				class="recipe-thumbnail"
				loading="lazy"
				src={item.image_url}
				alt="{item.name} thumbnail" />
		{/if}
	</div>
</a>

<style lang="scss">
	/* Recipe card container - flexbox layout */
	.recipe-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0;
		margin-bottom: 0.5rem;
		border-radius: 6px;
		transition: background-color 0.2s ease;
		text-decoration: none;
		color: inherit;
	}

	.stars {
		padding-bottom: 3px;
	}

	/* Recipe text section (left) */
	.recipe-card {
		flex-grow: 1;
		display: flex;
		margin-bottom: 0;
		flex-direction: column;
		min-height: 100px;
		gap: 0.5rem;
		max-width: calc(100% - 110px); /* Leave space for image */
		&:hover {
			background-color: var(--pico-secondary-focus);
		}
	}

	h3 {
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 1.7rem;
	}

	.created {
		font-size: 1rem;
		color: var(--pico-muted-color);
	}

	/* Star rating and favorite button */
	.star-fav {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.card-button {
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		padding: 0.5rem 0;
	}

	/* Image section (right) */
	.recipe-image {
		display: flex;
		justify-content: center;
		align-items: center;
		img {
			min-height: 100px;
			min-width: 100px;
		}
	}

	.recipe-thumbnail {
		object-fit: cover;
		border-radius: 6px;
		width: 100px;
		height: 100px;
	}

	@media (max-width: 576px) {
		h3 {
			font-size: 1rem;
			margin-bottom: 1rem;
			white-space: normal;
			overflow: visible;
			text-overflow: unset;
			word-wrap: break-word;
		}
		.created {
			display: none;
		}
	}
</style>
