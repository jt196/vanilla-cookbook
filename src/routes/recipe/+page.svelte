<script lang="ts">
	import type { PageData } from './$types'
	import { filterSearch } from '$lib/utils/filters'

	export let data: PageData

	$: ({ recipes } = data)

	let search = ''

	$: filteredRecipes = filterSearch(search, recipes, 'name')
</script>

<div class="grid">
	<div>
		<div class="grid">
			<h2>Recipes:</h2>
			<div class="align-right">
				<a href="/recipe/new" role="button">New</a>
			</div>
		</div>
		<div class="search-box">
			<input type="text" name="search" placeholder="Search my recipes" bind:value={search} />
		</div>
		{#each filteredRecipes as recipe}
			<article>
				<div class="grid">
					<div>
						<header>{recipe.name}</header>
					</div>
					<div class="align-right">
						{#if recipe.userId === data.user?.userId}
							<form action="?/deleteRecipe&uid={recipe.uid}" method="POST">
								<button type="submit" class="outline secondary">Delete</button>
							</form>
							<a href="recipe/edit/{recipe.uid}" role="button" class="outline contrast">Edit</a>
							<a href="recipe/view/{recipe.uid}" role="button" class="outline contrast">View</a>
						{/if}
					</div>
				</div>
			</article>
		{/each}
	</div>
</div>

<style lang="scss">
	.align-right {
		text-align: right;
	}
	.search-box {
		margin-top: 1rem;
	}
</style>
