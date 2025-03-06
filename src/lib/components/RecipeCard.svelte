<!-- RecipeCard.svelte -->
<script>
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'
	import Favourite from '$lib/components/svg/Favourite.svelte'
	import { localDate } from '$lib/utils/dateTime'
	import StarRating from '$lib/components/StarRating.svelte'
	import { addRecipeToFavourites } from '$lib/utils/crud'

	/** @type {{item: any, data: any, recipeFavourited?: (uid: string) => void, recipeRatingChanged?: (uid: string, rating: number) => void}}, */
	let { item, data, recipeFavourited, recipeRatingChanged } = $props();

	async function handleFavourite(uid, event) {
		// Preventing the click through to the item view page
		event.preventDefault()
		// Stop the click event from bubbling up to the parent anchor
		event.stopPropagation()
		console.log('Handle favourites button clicked for uid: ' + uid)
		const success = await addRecipeToFavourites(uid)
		if (success && recipeFavourited) {
			recipeFavourited(uid);
		}
	}
</script>

<a href="/recipe/{item.uid}/view/">
	<article>
		<div class="grid">
			<div>
				{#if item.photos && item.photos.length > 0}
					<img
						class="recipe-thumbnail"
						loading="lazy"
						src="/api/recipe/image/{item.photos[0].id}"
						alt="{item.name} thumbnail" />
				{:else}
					<FoodBowl width="100px" />
				{/if}
				<div class="badges">
					{#if item.log && item.log.length > 0}
						<span
							data-tooltip="This recipe has been cooked {item.log.length} times"
							data-placement="right"
							class="log-badge">{item.log.length}</span>
					{/if}
				</div>
			</div>
			<div href="/recipe/{item.uid}/view/" class="recipe-card">
				<h3>{item.name}</h3>
				<span class="created">
					<i>{localDate(item.created)}</i>
				</span>
				<StarRating 
					rating={item.rating} 
					editable={true} 
					ratingChanged={(newRating) => {
						console.log("🚀 RecipeCard ratingChanged triggered:", newRating);
						recipeRatingChanged?.(item.uid, newRating); // Call only if defined
					}} 
				/>
			</div>
			<div class="align-right recipe-buttons">
				{#if item.userId === data.user?.requestedUserId}
					<button
						onclick={(event) => handleFavourite(item?.uid, event)}
						data-tooltip="Favourite Recipe"
						class="outline secondary">
						<Favourite
							favourite={item?.on_favorites}
							width="30px"
							height="30px"
							fill="var(--pico-del-color)" />
					</button>
				{/if}
			</div>
		</div>
	</article>
</a>

<style lang="scss">
	.recipe-thumbnail {
		width: 100px;
		height: auto;
		max-height: 100px;
		object-fit: cover;
		display: block;
		@media (max-width: 767px) {
			max-height: 75px;
		}
	}

	.grid {
		display: grid;
		position: relative;
		grid-template-columns: 100px 3fr 1fr; // 100px for the image, 3 parts for the recipe card, and 1 part for the buttons
		gap: 1rem; // Spacing between grid items
		align-items: center;
		.badges {
			display: flex;
			gap: 0.3rem;
			height: 25px;
			align-items: center;
			margin: 0.3rem 0 0 0;
			justify-content: center;
			align-items: center;

			position: absolute; /* Position the badge within the relatively positioned button */
			top: -2%;
			left: -1%;
			@media (max-width: 767px) {
				top: -2%;
				left: -2%;
			}
			.log-badge {
				background: var(--pico-primary);
				border-radius: 6px;
				color: var(--pico-primary-inverse);

				padding: 3px 6px;
				font-size: 12px;
			}
			.favourite button {
				align-items: center;
				justify-content: center;
				border: none;
				z-index: 2;
				display: flex;
				padding: 0;
				margin: 0;
				border-radius: 6px;
				height: 25px;
				width: 25px;
				align-items: center;
				background: var(--pico-del-color);
			}
		}
	}

	.recipe-card {
		grid-column: 2;
		color: inherit;
		h3 {
			text-decoration: none;
			margin: 0;
			padding: 0;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			@media (max-width: 767px) {
				font-size: 0.9rem;
				white-space: wrap;
			}
		}
	}

	.recipe-buttons {
		grid-column: 3;
		padding: 0.2rem;
		display: flex;
		justify-content: flex-end; // Aligns the buttons to the right side
		align-items: center; // Vertically centers the buttons if the container has a height
		gap: 0.5rem; // Adds spacing between the buttons
		z-index: 1;
		button,
		a {
			margin-bottom: 0;
			z-index: 2;
			height: var(--button-height);
			width: var(--button-height);
		}
		@media (max-width: 767px) {
			flex-direction: column;
			align-items: end;
			button,
			a {
				padding: 0.4rem;
			}
		}
	}

	article {
		transition: background-color 0.2s ease;
		padding: 1rem;
		margin-bottom: 1rem;
		@media (max-width: 767px) {
			padding: 0.5rem;
			margin-bottom: 0.5rem;
		}
	}

	article:hover {
		background-color: var(--pico-secondary-focus);
	}

	.created {
		margin: 0;
		padding: 0;
		font-size: 0.8rem;

		@media (max-width: 767px) {
			display: none;
		}
	}

	// Using CSS to adjust the button size variables
	:root {
		--dynamic-width: 30px;
		--dynamic-height: 30px;
		--button-height: 70px;
	}

	@media (max-width: 767px) {
		:root {
			--dynamic-width: 20px;
			--dynamic-height: 20px;
			--button-height: 60px;
		}
		header {
			font-size: 0.8rem;
		}
	}
</style>
