<script>
	import { filterSearch } from '$lib/utils/filters'
	import { sortRecipesByKey } from '$lib/utils/sorting'

	import RecipeFilter from '$lib/components/RecipeFilter.svelte'
	import RecipeList from '$lib/components/RecipeList.svelte'

	export let data

	let searchString = ''
	let searchKey = 'name'
	$: console.log('🚀 ~ file: +page.svelte:12 ~ searchKey:', searchKey)
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
			searchString,
			sortRecipesByKey(data.recipes, sortState.key, sortState.direction).sortedRecipes,
			searchKey
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
		<RecipeFilter
			bind:searchString
			bind:searchKey
			bind:activeButton
			bind:sortState
			on:sort={handleSort} />
		<RecipeList {filteredRecipes} {data} />
	</div>
</div>
