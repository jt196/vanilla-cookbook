<script>
	import { filterSearch } from '$lib/utils/filters'
	import { sortRecipesByKey } from '$lib/utils/sorting'

	import RecipeFilter from '$lib/components/RecipeFilter.svelte'
	import RecipeList from '$lib/components/RecipeList.svelte'

	export let data

	let search = ''
	// let sortKey = 'created'
	let sortState = {
		key: 'created', // default sort key
		direction: 'desc' // default sort direction
	}

	// let sortDirection = 'asc'
	let activeButton = 'created' // default active button
	let filteredRecipes = [] // Declare it before the reactive statement

	$: {
		filteredRecipes = filterSearch(
			search,
			sortRecipesByKey(data.recipes, sortState.key, sortState.direction).sortedRecipes,
			'name'
		)
	}

	function handleSort(event) {
		if (sortState.key === event.detail.key) {
			sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc'
		} else {
			sortState.key = event.detail.key
			sortState.direction = 'desc' // Default to descending when changing sort key
		}
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
		<RecipeFilter bind:search bind:activeButton bind:sortState on:sort={handleSort} />
		<RecipeList {filteredRecipes} {data} />
	</div>
</div>
