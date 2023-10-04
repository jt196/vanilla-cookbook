<script>
	import CategoryTree from '$lib/components/CategoryTree.svelte'
	import { deleteRecipeById, updateRecipe } from '$lib/utils/crud'
	import { goto } from '$app/navigation'
	import RecipeForm from '$lib/components/RecipeForm.svelte'
	import View from '$lib/components/svg/View.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import Sidebar from '$lib/components/Sidebar.svelte'
	import Burger from '$lib/components/svg/Burger.svelte'

	/**
	 * The page data type.
	 * @typedef {Object} PageData
	 * @property {Recipe} recipe - The recipe data.
	 * @see src/lib/typeDefinitions.js for the Recipe type definition
	 */

	let recipeCategories = [] // This will store the selected category UIDs for the recipe
	let allCategories = [] // This will store all available categories
	let selectedFiles = []
	let sidebarOpen = false

	/** @type {PageData} */
	export let data

	$: ({ recipe, allCategories, user } = data)

	$: recipeCategories =
		recipe && recipe.categories ? recipe.categories.map((cat) => cat.categoryUid) : []

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
				goto(`/${recipe.uid}/view/`)
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
</script>

<Sidebar bind:isOpen={sidebarOpen} on:close={handleSidebarClose}>
	<CategoryTree
		categories={allCategories}
		onCategoryClick={handleCategoryClick}
		selectedCategoryUids={recipeCategories} />
</Sidebar>

<div class="recipe-container" class:sidebar-open={sidebarOpen} on:close={handleSidebarClose}>
	<button data-tooltip="Display Category Selector" on:click={toggleSidebar}>
		<Burger width="1.5rem" />
	</button>
	<RecipeForm
		bind:recipe
		editMode="true"
		bind:selectedFiles
		{recipeCategories}
		buttonText="Update Recipe"
		onSubmit={handleSubmit} />
</div>

{#if recipe.userId === user.userId}
	<a href="/{recipe?.uid}/view/" role="button" class="outline contrast" data-testid="view-button">
		<View width="30px" height="30px" fill="var(--pico-ins-color)" />
	</a>
	<button
		on:click={() => handleDelete(recipe?.uid)}
		data-testid="delete-button"
		class="outline secondary">
		<Delete width="30px" height="30px" fill="var(--pico-del-color)" />
	</button>
{/if}

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
		button {
			margin-bottom: 1rem;
		}
	}
</style>
