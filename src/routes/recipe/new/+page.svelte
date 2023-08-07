<script lang="ts">
	import { decodeHTMLEntities } from '$lib/utils/filters'
	import { nutritionProcess } from '$lib/utils/filters'

	$: recipe = {
		name: '',
		source: '',
		source_url: '',
		cook_time: '',
		image_url: '',
		prep_time: '',
		ingredients: '',
		directions: '',
		total_time: '',
		servings: '',
		nutritional_info: ''
	}

	async function handleScrape(event: Event) {
		event.preventDefault()
		const formData = new FormData(event.target as HTMLFormElement)
		const url = formData.get('url')

		// Make a request to your scrapeRecipe endpoint
		const response = await fetch('?/scrapeRecipe', {
			method: 'POST',
			body: formData
		})

		if (response.ok) {
			let responseText = await response.text()
			responseText = decodeHTMLEntities(responseText)
			const primaryData = JSON.parse(responseText)
			// Checking if the data key exists and is of type string
			if (primaryData && typeof primaryData.data === 'string') {
				const nestedData = JSON.parse(primaryData.data)

				// Now, you can access the properties
				const scrapedRecipe = JSON.parse(nestedData[1]) // Because the nested JSON string is in the second position

				recipe.name = scrapedRecipe.name
				recipe.source = scrapedRecipe.author
				recipe.source_url = scrapedRecipe.sourceUrl
				recipe.cook_time = scrapedRecipe.cookTime
				recipe.image_url = scrapedRecipe.imageUrl
				recipe.prep_time = scrapedRecipe.prepTime
				recipe.ingredients = scrapedRecipe.ingredients.join('\n')
				recipe.directions = scrapedRecipe.instructions.join('\n\n')
				recipe.total_time = scrapedRecipe.totalTime
				recipe.servings = scrapedRecipe.yeld
				recipe.nutritional_info = nutritionProcess(scrapedRecipe.nutrition)
			}
		} else {
			// Handle the error (e.g., show an error message)
		}
	}
</script>

<form action="?/scrapeRecipe" method="POST" on:submit={handleScrape}>
	<h3>Scrape Recipe</h3>
	<label for="url"> URL </label>
	<input type="text" id="url" name="url" />
	<button type="submit">Scrape Recipe</button>
</form>

<form action="?/createRecipe" method="POST">
	<h3>New Recipe</h3>

	<label for="name"> Name </label>
	<input type="text" id="name" name="name" bind:value={recipe.name} />

	<label for="source"> Source </label>
	<input type="text" id="source" name="source" bind:value={recipe.source} />

	<label for="source_url"> Source URL </label>
	<input type="text" id="source_url" name="source_url" bind:value={recipe.source_url} />

	<label for="cook_time"> Cook Time </label>
	<input type="text" id="cook_time" name="cook_time" bind:value={recipe.cook_time} />

	<label for="image_url"> Image URL </label>
	<input type="text" id="image_url" name="image_url" bind:value={recipe.image_url} />

	<label for="prep_time"> Prep Time </label>
	<input type="text" id="prep_time" name="prep_time" bind:value={recipe.prep_time} />

	<label for="ingredients"> Ingredients </label>
	<textarea id="ingredients" name="ingredients" rows="5" bind:value={recipe.ingredients} />

	<label for="directions"> Directions </label>
	<textarea id="directions" name="directions" rows="5" bind:value={recipe.directions} />

	<label for="total_time"> Total Time </label>
	<input type="text" id="total_time" name="total_time" bind:value={recipe.total_time} />

	<label for="servings"> Servings </label>
	<input type="text" id="servings" name="servings" bind:value={recipe.servings} />

	<label for="nutritional_info"> Nutritional Information </label>
	<textarea
		id="nutritional_info"
		name="nutritional_info"
		rows="5"
		bind:value={recipe.nutritional_info} />

	<button type="submit">Add Recipe</button>
</form>
