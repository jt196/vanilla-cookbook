<script>
	import CategoryTree from '$lib/components/CategoryTree.svelte'
	import { deleteRecipeById, updateRecipe } from '$lib/utils/crud'
	import { goto } from '$app/navigation'
	import RecipeForm from '$lib/components/RecipeForm.svelte'
	import View from '$lib/components/svg/View.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'

	/**
	 * The page data type.
	 * @typedef {Object} PageData
	 * @property {Recipe} recipe - The recipe data.
	 * @see src/lib/typeDefinitions.js for the Recipe type definition
	 */

	let recipeCategories = [] // This will store the selected category UIDs for the recipe
	let allCategories = [] // This will store all available categories
	let selectedFiles = []
	$: console.log('🚀 ~ file: +page.svelte:19 ~ selectedFiles:', selectedFiles)

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
			console.log('🚀 ~ file: +page.svelte:58 ~ handleSubmit ~ file:', file)
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
</script>

<div class="recipe-container">
	<RecipeForm
		bind:recipe
		editMode="true"
		bind:selectedFiles
		{recipeCategories}
		buttonText="Update Recipe"
		onSubmit={handleSubmit} />
	<div class="category-container">
		<CategoryTree
			categories={allCategories}
			onCategoryClick={handleCategoryClick}
			selectedCategoryUids={recipeCategories} />
	</div>
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
		display: flex; /* Use Flexbox */
		justify-content: space-between; /* Add space between the form and the category tree */
		align-items: flex-start; /* Align items to the top */
	}

	.category-container {
		flex-basis: 300px; /* Set a fixed width for the category tree */
		overflow-y: auto; /* Add a scrollbar if the content overflows */
		max-height: 80vh; /* Set a maximum height */
	}
</style>
