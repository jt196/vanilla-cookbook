<script>
	import { deleteRecipeById, updateRecipe } from '$lib/utils/crud'
	import { goto } from '$app/navigation'
	import RecipeForm from '$lib/components/recipe/RecipeForm.svelte'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import ConfirmationDialog from '$lib/components/ui/ConfirmationDialog.svelte'
	import Spinner from '$lib/components/ui/Spinner.svelte'

	/**
	 * The page data type.
	 * @typedef {Object} PageData
	 * @property {Recipe} recipe - The recipe data.
	 * @see src/lib/typeDefinitions.js for the Recipe type definition
	 */

	let recipeCategories = $state([]) // This will store the selected category UIDs for the recipe
	let selectedFiles = $state([])
	let saveImageUrl = $state(false)

	// /** @type {{data: PageData}} */
	let { data } = $props()

	let recipe = $state(data?.recipe ?? {})
	let user = $state(data?.user ?? {})
	let aiEnabled = $state(data?.aiEnabled ?? false)
	let aiProvider = $state(data?.aiProvider ?? null)
	let aiSelectedProvider = $state(data?.aiSelectedProvider ?? null)
	let aiSelectedProviderConfigured = $state(data?.aiSelectedProviderConfigured ?? false)
	let isAdmin = $state(data?.isAdmin ?? false)
	let userUnits = $state(data?.userUnits ?? 'metric')
	let userLanguage = $state(data?.userLanguage ?? 'eng')
	let showDeleteConfirm = $state(false)
	let saving = $state(false)
	let feedbackMessage = $state('')
	let feedbackType = $state('info')

	$effect(() => {
		recipeCategories =
			recipe && recipe.categories ? recipe.categories.map((cat) => cat.categoryUid) : []
	})

	async function handleDelete(uid) {
		if (!uid) return
		showDeleteConfirm = true
	}

	async function handleSubmit(event) {
		event.preventDefault()
		saving = true
		feedbackMessage = ''

		const recipeWithCategories = {
			...recipe,
			categories: recipeCategories,
			saveImageUrl
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
				feedbackMessage = result.error || 'Failed to save recipe.'
				feedbackType = 'error'
			}
		} catch (error) {
			console.error('Error:', error)
			feedbackMessage = 'Failed to save recipe.'
			feedbackType = 'error'
		} finally {
			saving = false
		}
	}

	function handleSelectedFilesChange(files) {
		selectedFiles = files
	}
</script>
<div class="recipe-container">
	<RecipeForm
		bind:recipe
		editMode={true}
		bind:selectedFiles
		bind:saveImageUrl
		{recipeCategories}
		{aiEnabled}
		{aiProvider}
		{aiSelectedProvider}
		{aiSelectedProviderConfigured}
		{isAdmin}
		{userUnits}
		{userLanguage}
		buttonText="Update Recipe"
		cancelHref="/recipe/{recipe?.uid}/view/"
		onDelete={() => handleDelete(recipe?.uid)}
		onSelectedFilesChange={handleSelectedFilesChange}
		onSubmit={handleSubmit}
	/>
</div>

{#if feedbackMessage}
	<FeedbackMessage message={feedbackMessage} type={feedbackType} timeout={5000} />
{/if}

<ConfirmationDialog
	bind:isOpen={showDeleteConfirm}
	onClose={() => (showDeleteConfirm = false)}
	onConfirm={async () => {
		const success = await deleteRecipeById(recipe?.uid)
		showDeleteConfirm = false
		if (success) {
			goto('/')
		}
	}}
>
	{#snippet content()}
		<h3 class="font-bold text-lg">Delete Recipe</h3>
		<p class="py-4">Are you sure you want to delete this recipe?</p>
	{/snippet}
</ConfirmationDialog>

<Spinner visible={saving} spinnerContent="Saving recipe..." />

<style lang="scss">
	.recipe-container {
		justify-content: space-between;
		align-items: flex-start;
		padding: 0;
	}
</style>
