<script>
import { goto, invalidateAll } from '$app/navigation'
	import { navigating } from '$app/stores'
	import { filterSearch } from '$lib/utils/filters'
	import { sortRecipesByKey } from '$lib/utils/sorting'
	import RecipeFilter from '$lib/components/recipe/RecipeFilter.svelte'
	import RecipeList from '$lib/components/recipe/RecipeList.svelte'
	import Sidebar from '$lib/components/ui/Sidebar.svelte'
import CategoryTree from '$lib/components/category/CategoryTree.svelte'
import Button from '$lib/components/ui/Button.svelte'
	import Spinner from '$lib/components/ui/Spinner.svelte'
import CopyRecipeDialog from '$lib/components/recipe/CopyRecipeDialog.svelte'
	import { duplicateRecipe } from '$lib/utils/crud'
	import {
		sortState,
		searchString,
		searchKey,
		cookedFilter,
		favouriteFilter
	} from '$lib/stores/recipeFilter'

	/** @type {{recipes?: any[], categories?: any[], viewMode?: 'owner' | 'social', title?: string | null, useCats?: boolean, viewerUserId?: string | null, ownerUserId?: string | null, ownerUsername?: string | null, feedKind?: 'all' | 'user'}} */
	let {
		recipes = [],
		categories = [],
		viewMode = 'owner',
		title = null,
		useCats = false,
		viewerUserId = null,
		ownerUserId = null,
		ownerUsername = null,
		feedKind = 'user'
	} = $props()

	let sidebarOpen = $state(false)
	let filteredRecipes = $state([])
	let isLoading = $state(true)
	let selectedCategoryUids = $state([])
	let useAndLogic = $state(false)
	let isCopying = $state(false)
	let copyDialogOpen = $state(false)
	let copiedRecipe = $state(null)
	let copyMessage = $state(null)

	function handleCategoryClick(category) {
		if (selectedCategoryUids.includes(category.uid)) {
			selectedCategoryUids = selectedCategoryUids.filter((uid) => uid !== category.uid)
		} else {
			selectedCategoryUids = [...selectedCategoryUids, category.uid]
		}
	}

	function handleRecipeFavourited(uid, nextState, recipeItem) {
		if (feedKind === 'user' && recipeItem?.userId && recipeItem.userId !== viewerUserId && !nextState) {
			recipes = recipes.filter((recipe) => recipe.uid !== uid)
			return
		}

		recipes = recipes.map((recipe) =>
			recipe.uid === uid ? { ...recipe, on_favorites: nextState } : recipe
		)
	}

	function handleRecipeRatingChanged(uid, newRating) {
		recipes = recipes.map((recipe) =>
			recipe.uid === uid ? { ...recipe, rating: newRating } : recipe
		)
	}

	async function handleDuplicateRequested(uid) {
		if (!viewerUserId) return
		isCopying = true
		copyMessage = null
		const newUid = await duplicateRecipe(uid)
		if (!newUid) {
			isCopying = false
			copyMessage = 'Recipe already copied.'
			copyDialogOpen = true
			return
		}
		await invalidateAll()

		try {
			const response = await fetch(`/api/recipe/${newUid}`)
			if (response.ok) {
				copiedRecipe = await response.json()
			}
		} catch (err) {
			console.error('Failed to load duplicated recipe:', err)
		}

		isCopying = false
		copyDialogOpen = true
	}

	function handleCopyCancel() {
		copyDialogOpen = false
		copiedRecipe = null
		copyMessage = null
	}

	function handleCopyStay() {
		copyDialogOpen = false
		if (feedKind === 'all' && copiedRecipe) {
			recipes = [copiedRecipe, ...recipes]
		}
		copiedRecipe = null
		copyMessage = null
	}

	function handleCopyView() {
		if (!copiedRecipe?.uid) return
		const targetUid = copiedRecipe.uid
		copyDialogOpen = false
		copiedRecipe = null
		copyMessage = null
		invalidateAll().then(() => goto(`/recipe/${targetUid}/view/`))
	}

	$effect(() => {
		isLoading = true

		const recipeList = Array.isArray(recipes) ? recipes : []

		// Prevent rating sorting in social mode
		if (viewMode !== 'owner' && $sortState.key === 'rating') {
			sortState.set({ key: 'created', direction: 'desc' })
		}

		let sortedRecipes = sortRecipesByKey(
			recipeList,
			$sortState.key,
			$sortState.direction
		).sortedRecipes

		let categoryFilteredRecipes = sortedRecipes

		if (useCats && selectedCategoryUids.length > 0) {
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

		// Filtering by cooked status (owner only)
		if (viewMode === 'owner' && $cookedFilter) {
			categoryFilteredRecipes = categoryFilteredRecipes
				.filter((recipe) => recipe.log.length > 0)
				.sort((a, b) => {
					const cooksDiff = b.log.length - a.log.length
					if (cooksDiff !== 0) return cooksDiff
					return (a.name || '').localeCompare(b.name || '')
				})
		}

		// Filtering by favourite status
		if ($favouriteFilter) {
			categoryFilteredRecipes = categoryFilteredRecipes.filter(
				(recipe) => recipe.on_favorites === true
			)
		}

		filteredRecipes = filterSearch($searchString, categoryFilteredRecipes, $searchKey)

		setTimeout(() => {
			isLoading = false
		}, 0)
	})

	function handleSort(event) {
		if ($sortState.key === event.detail.key) {
			sortState.update((state) => ({
				...state,
				direction: state.direction === 'asc' ? 'desc' : 'asc'
			}))
		} else {
			sortState.set({ key: event.detail.key, direction: 'desc' })
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

{#if useCats && viewMode === 'owner'}
	<Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} onCategoryClick={handleCategoryClick}>
		<div class="flex justify-center items-center h-24 gap-4 px-4">
			{#if selectedCategoryUids}
				<Button onclick={clearCategory}>Clear</Button>
			{/if}
			{#if ownerUserId}
				<a href="/user/{ownerUserId}/categories" class="btn btn-ghost">Edit</a>
			{/if}
		</div>
		<div class="px-4 mb-4">
			<label class="label cursor-pointer justify-start gap-2">
				<input type="checkbox" bind:checked={useAndLogic} class="checkbox checkbox-primary" />
				<span class="label-text">{useAndLogic ? 'Using AND logic' : 'Using OR logic'}</span>
			</label>
		</div>
		<CategoryTree
			categories={categories}
			onCategoryClick={handleCategoryClick}
			{selectedCategoryUids}
			on:clearCategory={clearCategory} />
	</Sidebar>
{/if}

{#if title}
	<div class="mb-4 prose max-w-none flex justify-center">
		<h2>{title}</h2>
	</div>
{:else if viewMode === 'social' && ownerUsername}
	<div class="mb-4 prose max-w-none flex justify-center">
		<h2>{ownerUsername}'s Cookbook</h2>
	</div>
{/if}

<div
	class="transition-all duration-300"
	class:md:ml-64={sidebarOpen && useCats && viewMode === 'owner'}
	class:max-md:ml-0={sidebarOpen}>
	<RecipeFilter
		on:sort={handleSort}
		{toggleSidebar}
		viewOnly={false}
		useCats={useCats}
		username={ownerUsername}
		viewMode={viewMode} />
	<Spinner visible={isLoading || !!$navigating} spinnerContent="Loading" />
	<RecipeList
		{filteredRecipes}
		{viewMode}
		{viewerUserId}
		recipeFavourited={handleRecipeFavourited}
		recipeRatingChanged={handleRecipeRatingChanged}
		onDuplicate={handleDuplicateRequested} />
</div>

<CopyRecipeDialog
	bind:isOpen={copyDialogOpen}
	onCancel={handleCopyCancel}
	onStay={handleCopyStay}
	onView={handleCopyView}
	viewDisabled={!copiedRecipe?.uid}
	message={copyMessage} />

<Spinner visible={isCopying} spinnerContent="Copying Recipe" />
