<script>
	import { startsWithHttp } from '$lib/utils/filters'
	import { localDateAndTime } from '$lib/utils/dateTime'
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'

	export let filteredRecipes = []
	export let data
</script>

{#each filteredRecipes as recipe}
	<article>
		<div class="grid">
			<a href="recipe/view/{recipe.uid}" class="recipe-card">
				<div class="recipe-thumbnail">
					{#if recipe.image_url && startsWithHttp(recipe.image_url)}
						<img src={recipe.image_url} alt="{recipe.name} thumbnail" />
					{:else}
						<FoodBowl height="200px" />
					{/if}
				</div>
				<div>
					<header>{recipe.name}</header>
					<p>Created: <i>{localDateAndTime(recipe.created)}</i></p>
				</div>
			</a>
			<div class="align-right">
				{#if recipe.userId === data.user?.userId}
					<form action="?/deleteRecipe&uid={recipe.uid}" method="POST">
						<button type="submit" class="outline secondary">Delete</button>
					</form>
					<a href="recipe/edit/{recipe.uid}" role="button" class="outline contrast">Edit</a>
				{/if}
			</div>
		</div>
	</article>
{/each}

<style lang="scss">
	.recipe-thumbnail img {
		height: 200px; /* Set to your desired height */
		width: auto; /* This will ensure the width remains proportional */
		object-fit: cover;
		display: block; /* To remove any default spacing at the bottom of images */
	}

	/* Initial styles for the article */
	article {
		transition: background-color 0.2s ease; /* Smooth transition for the background color */
	}

	/* Hover effect for the article */
	article:hover {
		background-color: var(--pico-secondary-focus); /* Change this to your desired hover color */
	}
</style>
