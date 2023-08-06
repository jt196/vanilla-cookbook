<script lang="ts">
	import type { PageData } from './$types'

	export let data: PageData

	$: ({ recipes } = data)
</script>

<form action="?/createRecipe" method="POST">
	<h3>New Recipe</h3>
	<label for="name"> Name </label>
	<input type="text" id="name" name="name" />
	<label for="description"> Description </label>
	<textarea id="description" name="description" rows={5} />
	<button type="submit">Add Recipe</button>
</form>
