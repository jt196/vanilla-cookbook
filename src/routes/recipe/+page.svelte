<script lang="ts">
	import type { PageData } from './$types'

	export let data: PageData

	$: ({ recipes } = data)
</script>

<div class="grid">
	<div>
		<div class="grid">
			<h2>Recipes:</h2>
			<div class="align-right">
				<a href="/recipe/new" role="button">New</a>
			</div>
		</div>
		{#each recipes as recipe}
			<article>
				<div class="grid">
					<div>
						<header>{recipe.name}</header>
					</div>
					<div class="align-right">
						{#if recipe.userId === data.user?.userId}
							<form action="?/deleteRecipe&uid={recipe.uid}" method="POST">
								<button type="submit" class="outline secondary">Delete recipe</button>
							</form>
							<a href="recipe/{recipe.uid}" role="button" class="outline contrast">Edit Recipe</a>
						{/if}
					</div>
				</div>
			</article>
		{/each}
	</div>
</div>

<style>
	.align-right {
		text-align: right;
	}
</style>
