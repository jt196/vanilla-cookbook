<script lang="ts">
	import { localDateAndTime } from '$lib/utils/dateTime'
	import type { PageData } from './$types'
	import type { Recipe, IParsedIngredient } from '$lib/types'
	import {
		decimalToFraction,
		ingredientProcess,
		scaleNumbersInString,
		startsWithHttp
	} from '$lib/utils/filters'
	import Scale from '$lib/components/Scale.svelte'
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'

	export let data: PageData
	let recipe: Recipe | null = null
	let ingredients: string[] = []
	let ingredientsArray: IParsedIngredient[] = []
	let scale = 1
	let scaledServings: string | null
	let directionLines: string[] = []

	$: if (data && data.recipe) {
		recipe = data.recipe
		ingredients = recipe.ingredients ? recipe.ingredients.split('\n') : []
		ingredientsArray = ingredientProcess(ingredients)
		recipe.directions ? (directionLines = recipe.directions.split('\n')) : null
		scaledServings = recipe.servings ? scaleNumbersInString(recipe.servings, scale) : null
	}
</script>

<h3>{recipe?.name}</h3>

<div class="grid">
	<div>
		<div class="recipe-thumbnail">
			{#if recipe?.image_url && startsWithHttp(recipe.image_url)}
				<img src={recipe.image_url} alt="{recipe.name} thumbnail" />
			{:else}
				<FoodBowl height="400px" />
			{/if}
		</div>

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
	</div>
	<div>
		<p>Ingredients:</p>
		<ul>
			{#each ingredientsArray as ingredient}
				<li>
					<strong>
						{ingredient.quantity ? decimalToFraction(ingredient.quantity * scale) : ''}
					</strong>
					{ingredient.unit && ingredient.unit !== 'q.b.' ? ingredient.unit : ''}
					{ingredient.ingredient}
				</li>
			{/each}
		</ul>
	</div>
</div>

{#if recipe?.description}
	<h4>Description:</h4>
	<p>
		{recipe?.description}
	</p>
{/if}

{#if directionLines}
	<h4>Directions:</h4>
	{#each directionLines as line}
		<p>{line}</p>
	{/each}
{/if}

<a href="/recipe/edit/{recipe?.uid}" role="button" class="outline contrast">Edit</a>

<style lang="scss">
	.recipe-thumbnail img {
		height: 400px; /* Set to your desired height */
		width: auto; /* This will ensure the width remains proportional */
		object-fit: cover;
		display: block; /* To remove any default spacing at the bottom of images */
	}
</style>
