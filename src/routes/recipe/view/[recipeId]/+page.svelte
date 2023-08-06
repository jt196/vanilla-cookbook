<script lang="ts">
	import { localDateAndTime } from '$lib/utils/dateTime'
	import type { PageData } from './$types'
	import type { Recipe } from '$lib/types'

	export let data: PageData
	let recipe: Recipe | null = null
	let ingredients: string[] = []

	$: if (data && data.recipe) {
		recipe = data.recipe
		ingredients = recipe.ingredients ? recipe.ingredients.split('\n') : []
	}
</script>

<h3>{recipe?.name}</h3>

<p>
	Description:
	{recipe?.description}
</p>
<p>Created: <i>{localDateAndTime(recipe.created)}</i></p>
<p>
	Source:
	{recipe?.source}
</p>
<p>
	Source URL:
	{recipe?.source_url}
</p>
<ul>
	{#each ingredients as ingredient}
		<li>{ingredient}</li>
	{/each}
</ul>
<a href="/recipe/edit/{recipe?.uid}" role="button" class="outline contrast">Edit</a>
