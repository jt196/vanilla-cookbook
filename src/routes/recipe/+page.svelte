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

	let selectedCategoryUid = null

	function handleCategoryClick(category) {
		if (selectedCategoryUid == category.uid) {
			selectedCategoryUid = null
		} else {
			selectedCategoryUid = category.uid // or category.uid, depending on how you want to filter
		}
	}

	$: {
		// Step 1: Sort the recipes
		let sortedRecipes = sortRecipesByKey(
			data.recipes,
			sortState.key,
			sortState.direction
		).sortedRecipes

		// Step 2: Filter by category
		let categoryFilteredRecipes = selectedCategoryUid
			? sortedRecipes.filter((recipe) =>
					recipe.categories.some((rc) => rc.category.uid === selectedCategoryUid)
			  )
			: sortedRecipes

		// Step 3: Filter by search string
		filteredRecipes = filterSearch(searchString, categoryFilteredRecipes, searchKey)
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

	function clearCategory() {
		selectedCategoryUid = null
	}
</script>

<Sidebar
	bind:isOpen={sidebarOpen}
	on:close={handleSidebarClose}
	let:onCategoryClick={handleCategoryClick}>
	<div class="clear-button">
		{#if selectedCategoryUid}
			<button on:click={clearCategory}>Clear</button>
		{/if}
	</div>
	<CategoryTree
		categories={data.categories}
		onCategoryClick={handleCategoryClick}
		{selectedCategoryUid}
		on:clearCategory={() => (selectedCategoryUid = null)}
		isRoot={true} /></Sidebar>

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
	.clear-button {
		display: flex; // Use flexbox
		justify-content: center; // Center horizontally
		align-items: center; // Center vertically
		height: 95px; // Set a fixed height, adjust as needed
	}
</style>
