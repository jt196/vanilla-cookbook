<script>
	import { filterSearch } from '$lib/utils/filters'
	import { sortRecipesByKey } from '$lib/utils/sorting'

	import RecipeFilter from '$lib/components/RecipeFilter.svelte'
	import RecipeList from '$lib/components/RecipeList.svelte'
	import Sidebar from '$lib/components/Sidebar.svelte'
	import Burger from '$lib/components/svg/Burger.svelte'
	import CategoryTree from '$lib/components/CategoryTree.svelte'

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

	let selectedCategoryUids = []

	let useAndLogic = false // Default to OR logic

	function handleCategoryClick(category) {
		if (selectedCategoryUids.includes(category.uid)) {
			selectedCategoryUids = selectedCategoryUids.filter((uid) => uid !== category.uid)
		} else {
			selectedCategoryUids = [...selectedCategoryUids, category.uid]
		}
	}

	function handleRecipeDeleted(event) {
		const deletedUid = event.detail
		filteredRecipes = filteredRecipes.filter((recipe) => recipe.uid !== deletedUid)
	}

	$: {
		let sortedRecipes = sortRecipesByKey(
			data.recipes,
			sortState.key,
			sortState.direction
		).sortedRecipes

		let categoryFilteredRecipes = sortedRecipes

		if (selectedCategoryUids.length > 0) {
			if (useAndLogic) {
				categoryFilteredRecipes = sortedRecipes.filter((recipe) =>
					selectedCategoryUids.every((uid) =>
						recipe.categories.some((rc) => rc.category.uid === uid)
					)
				)
			} else {
				categoryFilteredRecipes = sortedRecipes.filter((recipe) =>
					selectedCategoryUids.some((uid) =>
						recipe.categories.some((rc) => rc.category.uid === uid)
					)
				)
			}
		}

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
		selectedCategoryUids = []
	}
</script>

<Sidebar
	bind:isOpen={sidebarOpen}
	on:close={handleSidebarClose}
	let:onCategoryClick={handleCategoryClick}>
	<div class="sidebar-buttons">
		{#if selectedCategoryUids}
			<button on:click={clearCategory}>Clear</button>
		{/if}
		<a href="/recipe/categories" role="button">Edit</a>
	</div>
	<div class="sidebar-check">
		<label>
			<input type="checkbox" bind:checked={useAndLogic} />
			{useAndLogic ? 'Using AND logic' : 'Using OR logic'}
		</label>
	</div>
	<CategoryTree
		categories={data.categories}
		onCategoryClick={handleCategoryClick}
		{selectedCategoryUids}
		on:clearCategory={clearCategory}
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
			<RecipeList {filteredRecipes} {data} on:recipeDeleted={handleRecipeDeleted} />
		</div>
	</div>
</div>

<style lang="scss">
	.content {
		transition: margin-left 0.3s ease;
		padding: 0; // This is just an example, adjust as needed

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
	.sidebar-buttons {
		display: flex; // Use flexbox
		justify-content: center; // Center horizontally
		align-items: center; // Center vertically
		height: 95px; // Set a fixed height, adjust as needed
		gap: 1rem;
	}

	.sidebar-check {
		margin-left: 1rem;
	}
</style>
