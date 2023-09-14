<script>
	import CategoryTree from '$lib/components/CategoryTree.svelte'
	import StarRating from '$lib/components/StarRating.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import View from '$lib/components/svg/View.svelte'
	import { deleteRecipeById, updateRecipe, deletePhotoById } from '$lib/utils/crud'
	import { goto } from '$app/navigation'

	/**
	 * The page data type.
	 * @typedef {Object} PageData
	 * @property {Recipe} recipe - The recipe data.
	 * @see src/lib/typeDefinitions.js for the Recipe type definition
	 */

	let recipeCategories = [] // This will store the selected category UIDs for the recipe
	let allCategories = [] // This will store all available categories

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

	function handleRatingChange(event) {
		recipe.rating = event.detail
		console.log('New Rating:', recipe.rating)
	}

	async function handleDelete(uid) {
		const success = await deleteRecipeById(uid)
		if (success) {
			goto('/recipe')
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
				goto(`/recipe/view/${recipe.uid}`)
			} else {
				console.error('Error:', result.error)
			}
		} catch (error) {
			console.error('Error:', error)
		}
	}

	let selectedFiles = []

	function handleFilesChange(event) {
		selectedFiles = Array.from(event.target.files)
	}

	let filteredPhotos
	$: filteredPhotos =
		recipe && recipe.photos ? recipe.photos.filter((photo) => photo.url === null) : []

	$: console.log('🚀 ~ file: +page.svelte:65 ~ filteredPhotos:', filteredPhotos)

	async function handleDeletePhoto(photoId) {
		try {
			await deletePhotoById(photoId)
			// Optionally, remove the photo from the local state
			recipe.photos = recipe.photos.filter((p) => p.id !== photoId)
		} catch (error) {
			console.error('Error deleting photo:', error.message)
		}
	}
</script>

<div class="recipe-container">
	<form on:submit|preventDefault={handleSubmit}>
		<h3>Editing: {recipe.name}</h3>
		<label for="name"> Name </label>
		<input type="text" id="name" name="name" bind:value={recipe.name} />

		<StarRating bind:rating={recipe.rating} editable={true} on:ratingChanged={handleRatingChange} />
		<input type="hidden" name="rating" bind:value={recipe.rating} />

		<label for="source"> Source </label>
		<input type="text" id="source" name="source" bind:value={recipe.source} />

		<label for="source_url"> Source URL </label>
		<input type="text" id="source_url" name="source_url" bind:value={recipe.source_url} />

		<label for="cook_time"> Cook Time </label>
		<input type="text" id="cook_time" name="cook_time" bind:value={recipe.cook_time} />

		<label for="image_url"> Image URL </label>
		<input type="text" id="image_url" name="image_url" bind:value={recipe.image_url} />

		<label for="file">Upload Images</label>
		<input type="file" id="file" name="file" on:change={handleFilesChange} multiple />

		<div class="photos">
			{#each filteredPhotos as photo}
				<img src="/recipe_photos/{photo.id}.{photo.fileType}" alt="{recipe.name} photo" />
				<button class="outline secondary" on:click={() => handleDeletePhoto(photo.id)}
					><Delete width="30px" height="30px" fill="var(--pico-del-color)" /></button>
			{/each}
		</div>

		<label for="prep_time"> Prep Time </label>
		<input type="text" id="prep_time" name="prep_time" bind:value={recipe.prep_time} />

		<label for="ingredients"> Ingredients </label>
		<textarea id="ingredients" name="ingredients" rows="5" bind:value={recipe.ingredients} />

		<label for="directions"> Directions </label>
		<textarea id="directions" name="directions" rows="5" bind:value={recipe.directions} />

		<label for="total_time"> Total Time </label>
		<input type="text" id="total_time" name="total_time" bind:value={recipe.total_time} />

		<label for="servings"> Servings </label>
		<input type="text" id="servings" name="servings" bind:value={recipe.servings} />

		<label for="nutritional_info"> Nutritional Information </label>
		<textarea
			id="nutritional_info"
			name="nutritional_info"
			rows="5"
			bind:value={recipe.nutritional_info} />
		<button type="submit">Update Recipe</button>
		{#each recipeCategories as categoryUid}
			<input type="hidden" name="categories[]" value={categoryUid} />
		{/each}
	</form>
	<div class="category-container">
		<CategoryTree
			categories={allCategories}
			onCategoryClick={handleCategoryClick}
			selectedCategoryUids={recipeCategories} />
	</div>
</div>

{#if recipe.userId === user.userId}
	<a
		href="/recipe/view/{recipe?.uid}"
		role="button"
		class="outline contrast"
		data-testid="view-button">
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

	form {
		flex: 1; /* Take up the remaining space after the category tree */
		margin-right: 2rem; /* Add some margin for spacing */
	}

	.category-container {
		flex-basis: 300px; /* Set a fixed width for the category tree */
		overflow-y: auto; /* Add a scrollbar if the content overflows */
		max-height: 80vh; /* Set a maximum height */
	}

	.photos {
		margin-bottom: 1rem;
		img {
			max-height: 150px;
		}
	}
</style>
