<script>
	// Import only what's needed in the main file
	import { filterSearch } from '$lib/utils/filters'
	import { sortRecipesByDate, sortRecipesByTitle } from '$lib/utils/sorting'

	import RecipeFilter from '$lib/components/RecipeFilter.svelte'
	import RecipeList from '$lib/components/RecipeList.svelte'

	export let data

	$: ({ recipes } = data)

	let search = ''
	$: dateSort = ''
	$: titleSort = ''
	let activeButton = 'date'
	$: filteredRecipes = filterSearch(search, recipes, 'name')

	function sortDate() {
		activeButton = 'date'
		const result = sortRecipesByDate(filteredRecipes, dateSort)
		filteredRecipes = result.sortedRecipes
		dateSort = result.newSort
	}

	function sortTitle() {
		activeButton = 'title'
		const result = sortRecipesByTitle(filteredRecipes, titleSort)
		filteredRecipes = result.sortedRecipes
		titleSort = result.newSort
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
		<RecipeFilter
			bind:search
			bind:dateSort
			bind:titleSort
			bind:activeButton
			{sortDate}
			{sortTitle} />
		<RecipeList {filteredRecipes} {data} />
	</div>
</div>
