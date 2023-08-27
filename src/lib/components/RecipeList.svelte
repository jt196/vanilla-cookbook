<script>
	import { localDateAndTime } from '$lib/utils/dateTime'
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'
	import StarRating from './StarRating.svelte'
	import Delete from './svg/Delete.svelte'
	import Edit from './svg/Edit.svelte'
	import VirtualList from 'svelte-virtual-list'

	export let filteredRecipes = []
	export let data

	let start
	let end
</script>

<div class="container">
	<VirtualList items={filteredRecipes} bind:start bind:end let:item>
		<article>
			<div class="grid">
				{#if item.photos && item.photos.length > 0}
					<img
						class="recipe-thumbnail"
						loading="lazy"
						src="/recipe_photos/{item.photos[0].id}.{item.photos[0].fileType}"
						alt="{item.name} photo" />
				{:else}
					<FoodBowl width="100px" />
				{/if}
				<a href="recipe/view/{item.uid}" class="recipe-card">
					<div>
						<header>{item.name}</header>
						<p>Created: <i>{localDateAndTime(item.created)}</i></p>
						<StarRating rating={item.rating} />
					</div>
				</a>
				<div class="align-right recipe-buttons">
					{#if item.userId === data.user?.userId}
						<form action="?/deleteRecipe&uid={item.uid}" method="POST">
							<button type="submit" class="outline secondary">
								<Delete width="30px" height="30px" fill="var(--pico-del-color)" />
							</button>
						</form>
						<a href="recipe/edit/{item.uid}" role="button" class="outline contrast">
							<Edit width="30px" height="30px" fill="var(--pico-ins-color)" />
						</a>
					{/if}
				</div>
			</div>
		</article>
	</VirtualList>
	<p>showing items {start}-{end}</p>
</div>

<style lang="scss">
	.container {
		min-height: 200px;
		height: calc(100vh - 18em);
	}
	.recipe-thumbnail {
		width: 100px;
		height: auto;
		object-fit: cover;
		display: block;
	}

	.grid {
		display: grid;
		grid-template-columns: 100px 3fr 1fr; // 100px for the image, 3 parts for the recipe card, and 1 part for the buttons
		gap: 1rem; // Spacing between grid items
	}

	.recipe-card {
		grid-column: 2;
		text-decoration: none;
		color: inherit;
	}

	.recipe-buttons {
		grid-column: 3;
		padding: 0.2rem;
		display: flex;
		justify-content: flex-end; // Aligns the buttons to the right side
		align-items: center; // Vertically centers the buttons if the container has a height
		gap: 0.5rem; // Adds spacing between the buttons
		button {
			margin-bottom: 0;
		}
	}

	article {
		transition: background-color 0.2s ease;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	article:hover {
		background-color: var(--pico-secondary-focus);
	}
</style>
