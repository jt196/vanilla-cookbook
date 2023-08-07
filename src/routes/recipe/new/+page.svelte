<script lang="ts">
	$: recipe = {
		name: '',
		description: ''
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
			const responseText = await response.text()
			const primaryData = JSON.parse(responseText)
			// Checking if the data key exists and is of type string
			if (primaryData && typeof primaryData.data === 'string') {
				const nestedData = JSON.parse(primaryData.data)

				// Now, you can access the properties
				const recipe = JSON.parse(nestedData[1]) // Because the nested JSON string is in the second position

				console.log(recipe.name) // "Chef John's Fresh Salmon Cakes"
				console.log(recipe.author) // "Chef John"
				console.log(recipe.datePublished) // "2014-09-26T18:49:11.000Z"
				// ... and so on
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
	<label for="description"> Description </label>
	<textarea id="description" name="description" rows={5} bind:value={recipe.description} />
	<button type="submit">Add Recipe</button>
</form>
