<script>
	// Import only what's needed in the main file
	import { filterSearch } from '$lib/utils/filters'
	import { sortByDateAsc, sortByDateDesc, sortByKeyAsc, sortByKeyDesc } from '$lib/utils/sorting'

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
		activeButton = 'title'
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

<style lang="scss">
	.align-right {
		text-align: right;
	}

	.sort {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	.recipe-filters {
		margin-top: 1rem;
	}
	.recipe-thumbnail img {
		height: 200px; /* Set to your desired height */
		width: auto; /* This will ensure the width remains proportional */
		object-fit: cover;
		display: block; /* To remove any default spacing at the bottom of images */
	}

	.sort .secondary {
		border: 1px solid white;
	}
</style>
