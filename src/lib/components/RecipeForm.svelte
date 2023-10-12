<script>
	import { checkImageExistence } from '$lib/utils/image/imageUtils'
	import { onMount } from 'svelte'

	import PhotoSectionEdit from './PhotoSectionEdit.svelte'
	import PhotoSectionNew from './PhotoSectionNew.svelte'
	import StarRating from '$lib/components/StarRating.svelte'

	export let recipe
	$: console.log('🚀 ~ file: RecipeForm.svelte:11 ~ recipe.is_public:', recipe.is_public)
	export let onSubmit
	export let buttonText = 'Add Recipe' // Default button text
	export let selectedFiles = null

	export let baseUrl = ''
	export let editMode = false
	// If new recipe, default set to false
	if (!editMode) {
		recipe.is_public = false
	}
	export let recipeCategories = null

	onMount(() => {
		baseUrl = window.location.origin
	})

	let imageExists = false

	function handleRatingChange(event) {
		recipe.rating = event.detail
		console.log('New Rating:', recipe.rating)
	}

	$: if (recipe.image_url && baseUrl) {
		checkImageExistence(recipe.image_url, baseUrl).then((result) => {
			return (imageExists = result)
		})
	}
</script>

<form on:submit|preventDefault={onSubmit}>
	{#if !editMode}
		<h3>New Recipe</h3>
	{:else}
		<h3>Editing: {recipe.name}</h3>
	{/if}

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

	{#if editMode}
		<PhotoSectionEdit bind:recipe bind:selectedFiles />
	{:else}
		<PhotoSectionNew bind:recipe bind:imageExists />
	{/if}

	<label for="prep_time"> Prep Time </label>
	<input type="text" id="prep_time" name="prep_time" bind:value={recipe.prep_time} />

	<label for="ingredients"> Ingredients </label>
	<textarea id="ingredients" name="ingredients" rows="5" bind:value={recipe.ingredients} />

	<label for="description"> Description </label>
	<textarea id="description" name="description" rows="5" bind:value={recipe.description} />

	<label for="directions"> Directions </label>
	<textarea id="directions" name="directions" rows="5" bind:value={recipe.directions} />

	<label for="notes"> Notes </label>
	<textarea id="notes" name="notes" rows="5" bind:value={recipe.notes} />

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

	<label>
		<input
			type="checkbox"
			data-tooltip="Make your new recipe public"
			name="Recipe Public"
			bind:checked={recipe.is_public} />
		Recipe Public
	</label>

	<button type="submit">{buttonText}</button>
	{#if recipeCategories}
		{#each recipeCategories as categoryUid}
			<input type="hidden" name="categories[]" value={categoryUid} />
		{/each}
	{/if}
</form>
