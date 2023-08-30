<!-- RecipeCard.svelte -->
<script>
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'
	import { localDateAndTime } from '$lib/utils/dateTime'
	import StarRating from './StarRating.svelte'
	import Delete from './svg/Delete.svelte'
	import Edit from './svg/Edit.svelte'

	export let item
	export let data
</script>

<article>
	<div class="grid">
		{#if item.photos && item.photos.length > 0}
			<img
				class="recipe-thumbnail"
				loading="lazy"
				src="/recipe_photos/{item.photos[0].id}.{item.photos[0].fileType}"
				alt="{item.name} thumbnail" />
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
					<button type="submit" class="outline secondary" data-testid="delete-button">
						<Delete width="30px" height="30px" fill="var(--pico-del-color)" />
					</button>
				</form>
				<a
					href="recipe/edit/{item.uid}"
					role="button"
					class="outline contrast"
					data-testid="edit-button">
					<Edit width="30px" height="30px" fill="var(--pico-ins-color)" />
				</a>
			{/if}
		</div>
	</div>
</article>
