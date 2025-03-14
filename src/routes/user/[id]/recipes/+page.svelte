<script>
	import { filterSearch } from '$lib/utils/filters'
	import { sortRecipesByKey } from '$lib/utils/sorting'
	import RecipeFilter from '$lib/components/RecipeFilter.svelte'
	import RecipeList from '$lib/components/RecipeList.svelte'
	import Sidebar from '$lib/components/Sidebar.svelte'
	import CategoryTree from '$lib/components/CategoryTree.svelte'
	import { page } from '$app/stores'
	import {
		sortState,
		searchString,
		searchKey,
		cookedFilter,
		favouriteFilter
	} from '$lib/stores/recipeFilter'

	/** @type {{data: any}} */
	let { data = $bindable() } = $props()
	const { user } = data
	const { viewingUserId, publicProfile } = user
	let viewOnly = $state()
	// Changing user won't update the viewOnly attribute, so we need to get the id from params
	// As it doesn't update using the +page.server.js load function
	$effect(() => {
		const { params } = $page
		viewOnly = params.id !== viewingUserId
	})

	let sidebarOpen = $state(false)

	let filteredRecipes = $state([]) // Declare it before the reactive statement

	let selectedCategoryUids = $state([])

	let useAndLogic = $state(false) // Default to OR logic

	function handleCategoryClick(category) {
		if (selectedCategoryUids.includes(category.uid)) {
			selectedCategoryUids = selectedCategoryUids.filter((uid) => uid !== category.uid)
		} else {
			selectedCategoryUids = [...selectedCategoryUids, category.uid]
		}
	}

	function handleRecipeFavourited(uid) {
		console.log(`Recipe ${uid} (de)favourited!`)

		// Force a reactivity trigger by creating a new object reference
		data = {
			...data,
			recipes: data.recipes.map((recipe) =>
				recipe.uid === uid ? { ...recipe, on_favorites: !recipe.on_favorites } : recipe
			)
		}
	}

	function handleRecipeRatingChanged(uid, newRating) {
		console.log(`🚀 Rating changed for UID ${uid}: ${newRating}`)

		data = {
			...data,
			recipes: data.recipes.map((recipe) =>
				recipe.uid === uid
					? { ...recipe, rating: newRating } // Trigger reactivity
					: recipe
			)
		}
	}

	$effect(() => {
		let sortedRecipes = sortRecipesByKey(
			data.recipes,
			$sortState.key,
			$sortState.direction
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

		// Filtering by cooked status
		if ($cookedFilter) {
			categoryFilteredRecipes = categoryFilteredRecipes.filter((recipe) => recipe.log.length > 0)
		}

		// Filtering by favourite status
		if ($favouriteFilter) {
			categoryFilteredRecipes = categoryFilteredRecipes.filter(
				(recipe) => recipe.on_favorites === true
			)
		}

		filteredRecipes = filterSearch($searchString, categoryFilteredRecipes, $searchKey)
	})
	function handleSort(event) {
		if ($sortState.key === event.detail.key) {
			sortState.update((state) => ({
				...state,
				direction: state.direction === 'asc' ? 'desc' : 'asc'
			})) // Update store
		} else {
			sortState.key = event.detail.key
			sortState.set({ key: event.detail.key, direction: 'desc' }) // Update store
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

{#if !viewOnly}
	<Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} onCategoryClick={handleCategoryClick}>
		<div class="sidebar-buttons">
			{#if selectedCategoryUids}
				<button onclick={clearCategory}>Clear</button>
			{/if}
			<a href="/categories" role="button">Edit</a>
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
			on:clearCategory={clearCategory} />
	</Sidebar>
{/if}

<div class="content" class:sidebar-open={sidebarOpen} onclose={handleSidebarClose}>
	<div class="grid">
		<div>
			<RecipeFilter on:sort={handleSort} {toggleSidebar} {viewOnly} />
			<RecipeList
				{filteredRecipes}
				{data}
				recipeFavourited={handleRecipeFavourited}
				recipeRatingChanged={handleRecipeRatingChanged} />
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
