<script lang="ts">
	import type { PageData } from './$types'

	export let data: PageData

	$: ({ recipes } = data)
</script>

<a href="/recipe/new" role="button">New</a>
<br />
<br />
<div class="grid">
	<div>
		<h2>Recipe:</h2>
		{#each recipes as recipe}
			<article>
				<header>{recipe.name}</header>
				<p>
					{recipe.description}
				</p>
				{#if recipe.userId === data.user?.userId}
					<form action="?/deleteRecipe&uid={recipe.uid}" method="POST">
						<button type="submit" class="outline secondary">Delete recipe</button>
					</form>
					<a href="recipe/{recipe.uid}" role="button" class="outline constrast" style="width: 100%;"
						>Edit Recipe</a>
				{/if}
			</article>
		{/each}
	</div>
</div>
