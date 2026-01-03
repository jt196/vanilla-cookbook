<script>
	import { checkImageExistence } from '$lib/utils/image/imageUtils'
	import { onMount } from 'svelte'

	import PhotoSectionEdit from './PhotoSectionEdit.svelte'
	import PhotoSectionNew from './PhotoSectionNew.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Textarea from '$lib/components/ui/Form/Textarea.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Spinner from '$lib/components/Spinner.svelte'

	// If new recipe, default set to false
	/** @type {{recipe: any, onSubmit: any, buttonText?: string, selectedFiles?: any, baseUrl?: string, editMode?: boolean, recipeCategories?: any, aiEnabled?: boolean, userUnits?: string, userLanguage?: string}} */
	let {
		recipe = $bindable(),
		onSubmit,
		buttonText = 'Add Recipe',
		onSelectedFilesChange,
		baseUrl = '',
		editMode = false,
		recipeCategories = null,
		aiEnabled = false,
		userUnits = 'metric',
		userLanguage = 'eng'
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
	let cleaningIngredients = $state(false)
	let cleaningDirections = $state(false)

	async function handleCleanIngredients() {
		if (!recipe.ingredients || recipe.ingredients.trim() === '') return

		cleaningIngredients = true
		try {
			const response = await fetch('/api/recipe/cleanup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'ingredients',
					content: recipe.ingredients,
					userUnits,
					language: userLanguage
				})
			})

			if (!response.ok) {
				throw new Error('Cleanup failed')
			}

			const data = await response.json()
			if (data.ingredients) {
				recipe.ingredients = data.ingredients.join('\n')
			}
		} catch (err) {
			console.error('Ingredient cleanup failed:', err)
			alert('Failed to clean ingredients. Please try again.')
		} finally {
			cleaningIngredients = false
		}
	}

	async function handleSummarizeDirections() {
		if (!recipe.directions || recipe.directions.trim() === '') return

		cleaningDirections = true
		try {
			const response = await fetch('/api/recipe/cleanup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'directions',
					content: recipe.directions,
					userUnits,
					language: userLanguage
				})
			})

			if (!response.ok) {
				throw new Error('Cleanup failed')
			}

			const data = await response.json()
			if (data.instructions) {
				recipe.directions = data.instructions.join('\n\n')
			}
		} catch (err) {
			console.error('Direction summarization failed:', err)
			alert('Failed to summarize directions. Please try again.')
		} finally {
			cleaningDirections = false
		}
	}

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

<p class="text-xs mb-2 mt-2">
	<a target="_blank" href="https://www.markdownguide.org/basic-syntax/">Markdown</a> is supported for
	ingredients, directions and notes.
</p>

<form onsubmit={onSubmit} class="flex flex-col gap-5">
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
				<Input
					type="text"
					id="name"
					name="name"
					bind:value={recipe.name}
					label="Name"
					placeholder="Pasta alla Norma" />

				<Input
					type="text"
					id="source"
					name="source"
					bind:value={recipe.source}
					label="Source"
					placeholder="Mia nonna" />
				<Input
					type="text"
					id="source_url"
					name="source_url"
					placeholder="https://grannysrecipes.com"
					bind:value={recipe.source_url}
					label="Source URL" />
				<Input
					type="text"
					id="image_url"
					placeholder="https://grannysrecipes.com/norma.jpg"
					name="image_url"
					bind:value={recipe.image_url}
					label="Image URL" />
			</div>

			<div class="form-col">
				<Input
					type="text"
					id="prep_time"
					name="prep_time"
					placeholder="1 hour"
					bind:value={recipe.prep_time}
					label="Prep Time" />
				<Input
					type="text"
					id="cook_time"
					name="cook_time"
					placeholder="30 minutes"
					bind:value={recipe.cook_time}
					label="Cook Time" />
				<Input
					type="text"
					id="total_time"
					name="total_time"
					placeholder="1.5 hours"
					bind:value={recipe.total_time}
					label="Total Time" />
				<Input
					type="text"
					id="servings"
					placeholder="4 main course"
					name="servings"
					bind:value={recipe.servings}
					label="Servings" />
			</div>
		</div>

		<!-- Full-width photo section -->
		{#if editMode}
			<PhotoSectionEdit {recipe} {onSelectedFilesChange} />
		{:else}
			<PhotoSectionNew {recipe} {imageExists} />
		{/if}

		<!-- Full-width large text fields -->
		<div>
			<Textarea
				id="ingredients"
				name="ingredients"
				rows="7"
				placeholder="500g of pasta..."
				bind:value={recipe.ingredients}
				label="Ingredients" />
			{#if aiEnabled}
				<Button
					type="button"
					size="sm"
					style="soft"
					class="mt-2"
					onclick={handleCleanIngredients}
					disabled={cleaningIngredients || !recipe.ingredients || recipe.ingredients.trim() === ''}>
					{#if cleaningIngredients}
						<Spinner visible={true} size="xs" type="dots" />
						Cleaning...
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						Clean Ingredients
					{/if}
				</Button>
			{/if}
		</div>
		<Textarea
			id="description"
			name="description"
			rows="3"
			placeholder="This pasta was a favourite of my Nonna's"
			bind:value={recipe.description}
			label="Description" />
		<div>
			<Textarea
				id="directions"
				placeholder="Boil the pasta according to instructions..."
				rows="7"
				name="directions"
				bind:value={recipe.directions}
				label="Directions" />
			{#if aiEnabled}
				<Button
					type="button"
					size="sm"
					style="soft"
					class="mt-2"
					onclick={handleSummarizeDirections}
					disabled={cleaningDirections || !recipe.directions || recipe.directions.trim() === ''}>
					{#if cleaningDirections}
						<Spinner visible={true} size="xs" type="dots" />
						Summarizing...
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						Summarize Directions
					{/if}
				</Button>
			{/if}
		</div>
		<Textarea
			id="notes"
			name="notes"
			rows="3"
			placeholder="Don't overcook the pasta or she'll come back to haunt you"
			bind:value={recipe.notes}
			label="Notes" />
		<Textarea
			id="nutritional_info"
			name="nutritional_info"
			rows="3"
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
		gap: 1rem;
		margin-bottom: 1rem;

		@media (min-width: 768px) {
			grid-template-columns: 1fr 1fr;
			gap: 1.25rem;
		}
	}

	.form-col {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
</style>
