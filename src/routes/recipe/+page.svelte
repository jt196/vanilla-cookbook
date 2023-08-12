<script>
	import { filterSearch } from '$lib/utils/filters'
	import { sortRecipesByKey } from '$lib/utils/sorting'

	import RecipeFilter from '$lib/components/RecipeFilter.svelte'
	import RecipeList from '$lib/components/RecipeList.svelte'
	import Sidebar from '$lib/components/Sidebar.svelte'
	import Burger from '$lib/components/svg/Burger.svelte'
	import CategoryTree from '../../lib/components/CategoryTree.svelte'

	export let data

	let sidebarOpen = false
	let searchString = ''
	let searchKey = 'name'
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

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen
	}

	function handleSidebarClose() {
		sidebarOpen = false
	}
</script>

<Sidebar bind:isOpen={sidebarOpen} on:close={handleSidebarClose}
	><CategoryTree categories={data.categories} /></Sidebar>

<div class="content" class:sidebar-open={sidebarOpen} on:close={handleSidebarClose}>
	<div class="grid">
		<div>
			<div class="grid">
				<div>
					<button on:click={toggleSidebar}> <Burger width="1.5rem" /> </button>
				</div>
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
</div>

<style lang="scss">
	.content {
		transition: margin-left 0.3s ease;
		padding: 20px; // This is just an example, adjust as needed

		&.sidebar-open {
			margin-left: 250px;

			@media (max-width: 1279px) {
				padding-left: 0; // Remove left padding when the sidebar is open
				margin-left: 220px;
			}

			@media (max-width: 768px) {
				margin-left: 0;
			}
		}
	}
</style>
