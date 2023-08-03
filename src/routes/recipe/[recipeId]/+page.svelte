<script lang="ts">
	import type { PageData } from './$types'

	export let data: PageData
	$: ({ recipe } = data)
</script>

<form action="?/updateRecipe" method="POST">
	<h3>Editing: {recipe.title}</h3>
	<label for="title"> Title </label>
	<input type="text" id="title" name="title" value={recipe.title} />
	<label for="title"> Title </label>
	<textarea id="content" name="content" rows={5} value={recipe.content} />
	<button type="submit">Update Recipe</button>
</form>
