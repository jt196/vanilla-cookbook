<script lang="ts">
	import { localDateAndTime } from '$lib/utils/dateTime'
	import type { PageData } from './$types'
	import type { Recipe, IParsedIngredient } from '$lib/types'
	import { decimalToFraction, ingredientProcess, scaleNumbersInString } from '$lib/utils/filters'
	import Scale from '$lib/components/Scale.svelte'

	export let data: PageData
	let recipe: Recipe | null = null
	let ingredients: string[] = []
	let ingredientsArray: IParsedIngredient[] = []
	let scale = 1
	let scaledServings: string | null

	$: if (data && data.recipe) {
		recipe = data.recipe
		ingredients = recipe.ingredients ? recipe.ingredients.split('\n') : []
		ingredientsArray = ingredientProcess(ingredients)
		scaledServings = recipe.servings ? scaleNumbersInString(recipe.servings, scale) : null
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
	<a href={recipe?.source_url}>{recipe?.source}</a>
</p>
{#if ingredients}
	<p>
		{scaledServings}
	</p>
	<p>
		Scale
		<Scale bind:scale />
	</p>
{/if}
<p>Ingredients:</p>
<ul>
	{#each ingredientsArray as ingredient}
		<li>
			{ingredient.quantity ? decimalToFraction(ingredient.quantity * scale) : ''}
			{ingredient.unit ? ingredient.unit : ''}
			{ingredient.ingredient}
		</li>
	{/each}
</ul>
<a href="/recipe/edit/{recipe?.uid}" role="button" class="outline contrast">Edit</a>
