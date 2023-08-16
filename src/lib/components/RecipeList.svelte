<script>
	import { startsWithHttp } from '$lib/utils/filters'
	import { localDateAndTime } from '$lib/utils/dateTime'
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'
	import StarRating from './StarRating.svelte'

	export let filteredRecipes = []
	export let data
</script>

{#each filteredRecipes as recipe}
	<article>
		<div class="grid">
			<a href="recipe/view/{recipe.uid}" class="recipe-card">
				<div>
					<header>{recipe.name}</header>
					<p>Created: <i>{localDateAndTime(recipe.created)}</i></p>
					<StarRating rating={recipe.rating} />
				</div>
			</a>
			<div class="align-right recipe-buttons">
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

	.grid {
		grid-template-columns: 3fr 1fr; /* This means the first column (recipe-card) will take up 3 parts, and the second column will take up 1 part, making the first column 3/4 of the grid */
	}

	.recipe-card {
		grid-column: 1;
		text-decoration: none; /* Removes the underline from the link */
		color: inherit; /* Ensures the link color doesn't override the text color */
	}

	.recipe-buttons {
		grid-column: 2;
	}

	/* Initial styles for the article */
	article {
		transition: background-color 0.2s ease; /* Smooth transition for the background color */
		padding: 1rem;
		margin-bottom: 1rem;
	}

	/* Hover effect for the article */
	article:hover {
		background-color: var(--pico-secondary-focus); /* Change this to your desired hover color */
	}
</style>
