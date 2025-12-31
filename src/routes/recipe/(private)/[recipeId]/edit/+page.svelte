<script>
	import CategoryTree from '$lib/components/CategoryTree.svelte'
	import { deleteRecipeById, updateRecipe } from '$lib/utils/crud'
	import { goto } from '$app/navigation'
	import RecipeForm from '$lib/components/RecipeForm.svelte'
	import View from '$lib/components/svg/View.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import Sidebar from '$lib/components/Sidebar.svelte'
	import Burger from '$lib/components/svg/Burger.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	/**
	 * The page data type.
	 * @typedef {Object} PageData
	 * @property {Recipe} recipe - The recipe data.
	 * @see src/lib/typeDefinitions.js for the Recipe type definition
	 */

	let recipeCategories = $state([]) // This will store the selected category UIDs for the recipe
	let selectedFiles = $state([])
	let sidebarOpen = $state(false)

	// /** @type {{data: PageData}} */
	let { data } = $props()

	let recipe = $state(data?.recipe ?? {})
	let allCategories = $state(data?.allCategories ?? [])
	let user = $state(data?.user ?? {})

	$effect(() => {
		recipeCategories =
			recipe && recipe.categories ? recipe.categories.map((cat) => cat.categoryUid) : []
	})

	function handleCategoryClick(category) {
		if (recipeCategories.includes(category.uid)) {
			recipeCategories = recipeCategories.filter((uid) => uid !== category.uid)
		} else {
			recipeCategories = [...recipeCategories, category.uid]
		}
	}

	async function handleDelete(uid) {
		const success = await deleteRecipeById(uid)
		if (success) {
			goto('/')
		}
	}

	async function handleSubmit(event) {
		event.preventDefault()

		const recipeWithCategories = {
			...recipe,
			categories: recipeCategories
		}

		const formData = new FormData()

		// Append the entire recipe object
		formData.append('recipe', JSON.stringify(recipeWithCategories))

		// Append the selected files
		for (const file of selectedFiles) {
			formData.append('images', file)
		}

		try {
			const result = await updateRecipe(formData, recipe.uid)

			if (result.success) {
				// Handle success, maybe redirect or show a success message
				goto(`/recipe/${recipe.uid}/view/`)
			} else {
				console.error('Error:', result.error)
			}
		} catch (error) {
			console.error('Error:', error)
		}
	}

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen
	}

	function handleSidebarClose() {
		sidebarOpen = false
	}

	function handleSelectedFilesChange(files) {
		selectedFiles = files
	}
</script>

<Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose}>
	<CategoryTree
		categories={allCategories}
		onCategoryClick={handleCategoryClick}
		selectedCategoryUids={recipeCategories} />
</Sidebar>

<div class="flex gap-2">
	{#if recipe?.userId === user?.userId}
		<a
			href="/recipe/{recipe?.uid}/view/"
			class="btn btn-soft btn-primary btn-sm tooltip"
			data-tip="View Recipe"
			data-testid="view-button">
			<View />
		</a>
		<Button
			onclick={() => handleDelete(recipe?.uid)}
			data-testid="delete-button"
			class="btn btn-soft btn-sm tooltip btn-secondary">
			<Delete />
		</Button>
	{/if}
</div>

<div class="recipe-container" class:sidebar-open={sidebarOpen} onclose={handleSidebarClose}>
	{#if user.useCats}
		<Button class="tooltip" data-tip="Display Category Selector" onclick={toggleSidebar}>
			<Burger width="1.5rem" />
		</Button>
	{/if}
	<RecipeForm
		bind:recipe
		editMode={true}
		bind:selectedFiles
		{recipeCategories}
		buttonText="Update Recipe"
		onSelectedFilesChange={handleSelectedFilesChange}
		onSubmit={handleSubmit} />
</div>

<style lang="scss">
	.recipe-container {
		justify-content: space-between; /* Add space between the form and the category tree */
		align-items: flex-start; /* Align items to the top */
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
		:global(button) {
			margin-bottom: 1rem;
		}
	}
</style>
