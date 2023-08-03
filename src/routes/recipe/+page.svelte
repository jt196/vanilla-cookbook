<script lang="ts">
	import type { PageData } from './$types'

	export let data: PageData

	$: ({ recipes } = data)
</script>

<div class="grid">
	<div>
		<h2>Recipe:</h2>
		{#each recipes as recipe}
			<article>
				<header>{recipe.title}</header>
				<p>
					{recipe.content}
				</p>
				{#if recipe.userId === data.user?.userId}
					<form action="?/deleteRecipe&id={recipe.id}" method="POST">
						<button type="submit" class="outline secondary">Delete recipe</button>
					</form>
					<a href="recipe/{recipe.id}" role="button" class="outline constrast" style="width: 100%;"
						>Edit Recipe</a>
				{/if}
			</article>
		{/each}
	</div>
	{#if data.user}
		<form action="?/createRecipe" method="POST">
			<h3>New Recipe</h3>
			<label for="title"> Title </label>
			<input type="text" id="title" name="title" />
			<label for="title"> Content </label>
			<textarea id="content" name="content" rows={5} />
			<button type="submit">Add Recipe</button>
		</form>
	{/if}
</div>
