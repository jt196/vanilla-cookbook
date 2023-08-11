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
			<div class="align-right">
				{#if recipe.userId === data.user?.userId}
					<form action="?/deleteRecipe&uid={recipe.uid}" method="POST">
						<button type="submit" class="outline secondary">Delete</button>
					</form>
					<a href="recipe/edit/{recipe.uid}" role="button" class="outline contrast">Edit</a>
					<a href="recipe/view/{recipe.uid}" role="button" class="outline contrast">View</a>
				{/if}
			</div>
		</div>
	</article>
{/each}
