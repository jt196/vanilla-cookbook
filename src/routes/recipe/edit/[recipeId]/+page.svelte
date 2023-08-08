<script>
	/**
	 * The page data type.
	 * @typedef {Object} PageData
	 * @property {Recipe} recipe - The recipe data.
	 * @see src/lib/typeDefinitions.js for the Recipe type definition
	 */

	/** @type {PageData} */
	export let data
	$: ({ recipe } = data)
</script>

<form action="?/updateRecipe" method="POST">
	<h3>Editing: {recipe.name}</h3>
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
	<button type="submit">Update Recipe</button>
</form>

<a href="/recipe/view/{recipe.uid}" role="button" class="outline contrast">View</a>
