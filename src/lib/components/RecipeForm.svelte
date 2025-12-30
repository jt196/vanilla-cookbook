<script>
	import { checkImageExistence } from '$lib/utils/image/imageUtils'
	import { onMount } from 'svelte'

	import PhotoSectionEdit from './PhotoSectionEdit.svelte'
	import PhotoSectionNew from './PhotoSectionNew.svelte'
	import StarRating from '$lib/components/StarRating.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Textarea from '$lib/components/ui/Form/Textarea.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	// If new recipe, default set to false
	/** @type {{recipe: any, onSubmit: any, buttonText?: string, selectedFiles?: any, baseUrl?: string, editMode?: boolean, recipeCategories?: any}} */
	let {
		recipe = $bindable(),
		onSubmit,
		buttonText = 'Add Recipe',
		onSelectedFilesChange,
		baseUrl = '',
		editMode = false,
		recipeCategories = null
	} = $props()

	// Ensure is_public is always defined
	$effect(() => {
		if (recipe && recipe.is_public === undefined) {
			recipe.is_public = false
		}
	})

	onMount(() => {
		baseUrl = window.location.origin
	})

	let imageExists = $state(false)

	function handleRatingChange(event) {
		recipe.rating = event.detail
		console.log('New Rating:', recipe.rating)
	}

	$effect(() => {
		if (recipe.image_url && baseUrl) {
			checkImageExistence(recipe.image_url, baseUrl).then((result) => {
				return (imageExists = result)
			})
		}
	})
</script>

<p>
	<a target="_blank" href="https://www.markdownguide.org/basic-syntax/">Markdown</a> is supported for
	ingredients, directions and notes.
</p>

<form onsubmit={onSubmit}>
	<div class="form-grid">
		<div class="form-col">
			{#if !editMode}
				<h3>New Recipe</h3>
			{:else}
				<h3>Editing: {recipe.name}</h3>
			{/if}
		</div>
	</div>
	<div>
		<!-- Two-column layout for compact fields -->
		<div class="form-grid">
			<div class="form-col">
				<Input type="text" id="name" name="name" bind:value={recipe.name} label="Name" />

				<Input type="text" id="source" name="source" bind:value={recipe.source} label="Source" />
				<Input
					type="text"
					id="source_url"
					name="source_url"
					bind:value={recipe.source_url}
					label="Source URL" />
				<StarRating
					bind:rating={recipe.rating}
					editable={true}
					on:ratingChanged={handleRatingChange} />
				<input type="hidden" name="rating" bind:value={recipe.rating} />
				<Checkbox
					name="Recipe Public"
					bind:checked={recipe.is_public}
					data-tooltip="Make your new recipe public"
					label="Recipe Public"
					size="sm"
					color="primary" />
			</div>

			<div class="form-col">
				<Input
					type="text"
					id="prep_time"
					name="prep_time"
					bind:value={recipe.prep_time}
					label="Prep Time" />
				<Input
					type="text"
					id="cook_time"
					name="cook_time"
					bind:value={recipe.cook_time}
					label="Cook Time" />
				<Input
					type="text"
					id="total_time"
					name="total_time"
					bind:value={recipe.total_time}
					label="Total Time" />
				<Input
					type="text"
					id="servings"
					name="servings"
					bind:value={recipe.servings}
					label="Servings" />
			</div>
		</div>

		<!-- Full-width photo section -->
		<Input
			type="text"
			id="image_url"
			name="image_url"
			bind:value={recipe.image_url}
			label="Image URL" />

		{#if editMode}
			<PhotoSectionEdit {recipe} {onSelectedFilesChange} />
		{:else}
			<PhotoSectionNew {recipe} {imageExists} />
		{/if}

		<!-- Full-width large text fields -->
		<Textarea
			id="ingredients"
			name="ingredients"
			bind:value={recipe.ingredients}
			label="Ingredients" />
		<Textarea
			id="description"
			name="description"
			bind:value={recipe.description}
			label="Description" />
		<Textarea id="directions" name="directions" bind:value={recipe.directions} label="Directions" />
		<Textarea id="notes" name="notes" bind:value={recipe.notes} label="Notes" />
		<Textarea
			id="nutritional_info"
			name="nutritional_info"
			bind:value={recipe.nutritional_info}
			label="Nutritional Information" />
		<Button type="submit">{buttonText}</Button>
		{#if recipeCategories}
			{#each recipeCategories as categoryUid}
				<input type="hidden" name="categories[]" value={categoryUid} />
			{/each}
		{/if}
	</div>
</form>

<style lang="scss">
	.form-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0;
		margin-bottom: 1rem;

		@media (min-width: 768px) {
			grid-template-columns: 1fr 1fr;
			gap: 1rem;
		}
	}

	.form-col {
		display: flex;
		flex-direction: column;
	}
</style>
