<script>
	import { filterSearch } from '$lib/utils/filters'
	import { sortRecipesByKey } from '$lib/utils/sorting'
	import RecipeFilter from '$lib/components/RecipeFilter.svelte'
	import RecipeList from '$lib/components/RecipeList.svelte'
	import Sidebar from '$lib/components/Sidebar.svelte'
	import CategoryTree from '$lib/components/CategoryTree.svelte'
	import { page, navigating } from '$app/stores'
	import {
		sortState,
		searchString,
		searchKey,
		cookedFilter,
		favouriteFilter
	} from '$lib/stores/recipeFilter'
	import Button from '$lib/components/ui/Button.svelte'
	import Spinner from '$lib/components/Spinner.svelte'

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
	let isLoading = $state(true) // Add loading state

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
		console.log(`Rating changed for UID ${uid}: ${newRating}`)

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
		isLoading = true // Set loading at start of effect

		// Debug logging
		console.log('data.recipes:', data.recipes)
		console.log('Is array?', Array.isArray(data.recipes))

		// Ensure recipes is an array
		const recipes = Array.isArray(data.recipes) ? data.recipes : []

		let sortedRecipes = sortRecipesByKey(
			recipes,
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

		// Set loading to false after a small delay to prevent flash
		setTimeout(() => { isLoading = false }, 0)
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
		<div class="flex justify-center items-center h-24 gap-4 px-4">
			{#if selectedCategoryUids}
				<Button onclick={clearCategory}>Clear</Button>
			{/if}
			<a href="/user/{user.userId}/categories" class="btn btn-ghost">Edit</a>
		</div>
		<div class="px-4 mb-4">
			<label class="label cursor-pointer justify-start gap-2">
				<input type="checkbox" bind:checked={useAndLogic} class="checkbox checkbox-primary" />
				<span class="label-text">{useAndLogic ? 'Using AND logic' : 'Using OR logic'}</span>
			</label>
		</div>
		<CategoryTree
			categories={data.categories}
			onCategoryClick={handleCategoryClick}
			{selectedCategoryUids}
			on:clearCategory={clearCategory} />
	</Sidebar>
{/if}

<div
	class="transition-all duration-300"
	class:md:ml-64={sidebarOpen && !viewOnly}
	class:max-md:ml-0={sidebarOpen}>
	<RecipeFilter
		on:sort={handleSort}
		{toggleSidebar}
		{viewOnly}
		useCats={publicProfile.useCats}
		username={publicProfile.username} />
	<Spinner visible={isLoading || !!$navigating} spinnerContent="Loading" />
	<RecipeList
		{filteredRecipes}
		{data}
		recipeFavourited={handleRecipeFavourited}
		recipeRatingChanged={handleRecipeRatingChanged} />
</div>
