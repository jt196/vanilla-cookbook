<script lang="ts">
	import type { PageData } from './$types'

	export let data: PageData
	$: ({ recipe } = data)
</script>

<form action="?/updateRecipe" method="POST">
	<h3>Editing: {recipe.name}</h3>
	<label for="name"> Name </label>
	<input type="text" id="name" name="name" value={recipe.name} />
	<label for="source"> Source </label>
	<input type="text" id="source" name="source" value={recipe.source} />
	<label for="description"> Description </label>
	<textarea id="description" name="description" rows={5} value={recipe.description} />
	<label for="ingredients"> Ingredients </label>
	<textarea id="ingredients" name="ingredients" rows={10} value={recipe.ingredients} />
	<button type="submit">Update Recipe</button>
</form>

<a href="/recipe/view/{recipe.uid}" role="button" class="outline contrast">View</a>
