<script>
	import { filterSearch } from '$lib/utils/filters'
	import { sortRecipesByKey } from '$lib/utils/sorting'

	import RecipeFilter from '$lib/components/RecipeFilter.svelte'
	import RecipeList from '$lib/components/RecipeList.svelte'
	import Sidebar from '$lib/components/Sidebar.svelte'
	import Burger from '$lib/components/svg/Burger.svelte'
	import Export from '$lib/components/svg/Export.svelte'
	import New from '$lib/components/svg/New.svelte'
	import House from '$lib/components/svg/House.svelte'
	import CategoryTree from '$lib/components/CategoryTree.svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { sortState, searchString, searchKey } from '$lib/stores'

	export let data
	const { user } = data
	const { requestedUserId, viewingUserId, publicProfile } = user
	let viewOnly
	// Changing user won't update the viewOnly attribute, so we need to get the id from params
	// As it doesn't update using the +page.server.js load function
	$: {
		const { params } = $page
		viewOnly = params.id !== viewingUserId
	}

	let sidebarOpen = false

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

		filteredRecipes = filterSearch($searchString, categoryFilteredRecipes, $searchKey)
	}
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

	async function handleExport() {
		const response = await fetch('/api/recipe/export', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(filteredRecipes)
		})

		if (response.ok) {
			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.style.display = 'none'
			a.href = url
			a.download = 'export.paprikarecipes' // Name of the file to be downloaded
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
		} else {
			console.error('Failed to export recipes')
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
	<Sidebar
		bind:isOpen={sidebarOpen}
		on:close={handleSidebarClose}
		let:onCategoryClick={handleCategoryClick}>
		<div class="sidebar-buttons">
			{#if selectedCategoryUids}
				<button on:click={clearCategory}>Clear</button>
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
			on:clearCategory={clearCategory} /></Sidebar>
{/if}

<div class="content" class:sidebar-open={sidebarOpen} on:close={handleSidebarClose}>
	<div class="grid">
		<div>
			<div class="menu-buttons">
				{#if !viewOnly}
					<button data-tooltip="Display Category Filter" on:click={toggleSidebar}>
						<Burger width="1.5rem" />
					</button>
				{:else}
					<button
						data-tooltip="Go to my recipes"
						on:click={() => goto(`/user/${viewingUserId}/recipes`)}>
						<House width="1.5rem" />
					</button>
					<h3>{publicProfile.name} Recipes</h3>
				{/if}
				<div class="spacer" />
				<button data-tooltip="Export Filtered Recipes" on:click={handleExport}
					><Export width="30px" height="30px" /></button>
				<a href="/new" data-tooltip="New Recipe" role="button"
					><New width="30px" height="30px" /></a>
			</div>
			<RecipeFilter on:sort={handleSort} />
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
	.menu-buttons {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		.spacer {
			flex-grow: 1;
		}
	}
</style>
