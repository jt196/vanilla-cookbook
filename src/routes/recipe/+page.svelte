<script lang="ts">
	import type { PageData } from './$types'
	import { filterSearch } from '$lib/utils/filters'
	import { sortByDateAsc, sortByDateDesc, sortByKeyAsc, sortByKeyDesc } from '$lib/utils/sorting'
	import SortAscDesc from '$lib/components/svg/SortAscDesc.svelte'
	import { localDateAndTime } from '$lib/utils/dateTime'

	export let data: PageData

	$: ({ recipes } = data)

	let search = ''
	$: dateSort = ''
	$: titleSort = ''

	$: filteredRecipes = filterSearch(search, recipes, 'name')

	function sortDate() {
		// sort the data by date
		if (!dateSort || dateSort == 'desc') {
			dateSort = 'asc'
			filteredRecipes = sortByDateAsc(filteredRecipes, 'created')
		} else {
			dateSort = 'desc'
			filteredRecipes = sortByDateDesc(filteredRecipes, 'created')
		}
		return dateSort
	}

	function sortTitle() {
		// sort the data by date
		if (!titleSort || titleSort == 'desc') {
			titleSort = 'asc'
			filteredRecipes = sortByKeyAsc(filteredRecipes, 'name')
		} else {
			titleSort = 'desc'
			filteredRecipes = sortByKeyDesc(filteredRecipes, 'name')
		}
		return titleSort
	}
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
		<div class="grid">
			<div>Sort By:</div>
			<div>
				<button on:click={sortDate}>Date <SortAscDesc sort={dateSort} /></button>
			</div>
			<div>
				<button on:click={sortTitle}>Title<SortAscDesc sort={titleSort} /></button>
			</div>
		</div>
		{#each filteredRecipes as recipe}
			<article>
				<div class="grid">
					<div>
						<header>{recipe.name}</header>
						<p>Created: <i>{localDateAndTime(recipe.created)}</i></p>
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
