<script>
	import { ingredientProcess, scaleNumbersInString } from '$lib/utils/filters'
	import { normalizeIngredient } from '$lib/utils/converter'
	import { determineSystem, parseRecipeText } from '$lib/utils/converter'
	import { getSanitizedHTML } from '$lib/utils/render'
	import { onMount, onDestroy } from 'svelte'
	import { setupWakeLock, cleanupWakeLock } from '$lib/utils/wakeLock.js'

	import RecipeViewButtons from '$lib/components/recipe/RecipeViewButtons.svelte'
	import RecipeViewCover from '$lib/components/recipe/RecipeViewCover.svelte'
	import RecipeViewAbout from '$lib/components/recipe/RecipeViewAbout.svelte'
	import RecipeViewDesc from '$lib/components/recipe/RecipeViewDesc.svelte'
	import RecipeViewIngs from '$lib/components/recipe/RecipeViewIngs.svelte'
	import RecipeViewOtherPhotos from '$lib/components/recipe/RecipeViewOtherPhotos.svelte'
	import RecipeViewDirections from '$lib/components/recipe/RecipeViewDirections.svelte'
	import RecipeViewNotes from '$lib/components/recipe/RecipeViewNotes.svelte'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import Toggle from '$lib/components/ui/Form/Toggle.svelte'
	import { sortByDate } from '$lib/utils/sorting.js'
	import { recipeRatingChange, updatePhotos } from '$lib/utils/crud.js'

	/** @type {{data: any}} */
	let { data = $bindable() } = $props()
	let isLoading = $state(true)

	let { recipe, categories, viewUser, logs, recUser } = $state(data)
	$effect(() => {
		({ recipe, categories, viewUser, logs, recUser } = data)
	})

	// Scaling factor for the ingredients
	let scale = $state(1)

	let convertedIngredients = $state([])

	let recipeFeedback = $state('')

	let selectedSystem = $state(null)

	let mainPhoto = $state()

	let otherPhotos = $state([])

	let loadingIngredients = $state(true)

	// Toggle for showing original vs summarized directions
	let showOriginalDirections = $state(false)

	let viewOnly = $derived(recipe.userId !== viewUser.userId)

	// Callback functions to update the state
	function handleScaleChange(newScale) {
		console.log('Scale updated to', newScale)
		scale = newScale
	}

	function handleSelectedSystemChange(newSystem) {
		console.log('Selected system updated to', newSystem)
		selectedSystem = newSystem
	}

	$effect(() => {
		if (recipe && recipe.photos && recipe.photos.length > 0) {
			const selectedMainPhoto =
				recipe.photos.find((photo) => photo.isMain) ||
				recipe.photos.find((photo) => !photo.isMain && photo.url === null) ||
				recipe.photos.find((photo) => !photo.isMain)

			mainPhoto = selectedMainPhoto
			otherPhotos = recipe.photos.filter((photo) => photo.id !== selectedMainPhoto?.id)
		} else {
			mainPhoto = null
			otherPhotos = []
		}
	})

	$effect(() => {
		if (!selectedSystem && viewUser?.units) {
			selectedSystem = viewUser.units
		}
	})

	// Function to handle the API fetch
	async function handleIngAPIFetch(measurementSystem, selectedSystem) {
		loadingIngredients = true
		try {
			const response = await fetch(`/api/ingredients`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					ingredients: ingredientsArray,
					fromSystem: measurementSystem.system,
					toSystem: selectedSystem,
					skipSmallUnits: viewUser.skipSmallUnits,
					language: viewUser.language
				})
			})

			if (response.ok) {
				const data = await response.json()
				convertedIngredients = data // Update convertedIngredients with the fetched data
				loadingIngredients = false
			} else {
				console.error('API request failed:', response.statusText)
			}
		} catch (error) {
			console.error('Error:', error)
		}
	}

	let ingredients = $derived(recipe.ingredients ? recipe.ingredients.split('\n') : [])
	let ingredientsArray = $derived(ingredientProcess(ingredients, viewUser.language))
	let measurementSystem = $derived(determineSystem(ingredientsArray))
	// Use original directions if toggle is on and original exists, otherwise use summarized
	let activeDirections = $derived(
		showOriginalDirections && recipe.directions_original
			? recipe.directions_original
			: recipe.directions
	)
	let directionLines = $derived(activeDirections ? activeDirections.split('\n') : [])
	let notesLines = $derived(recipe.notes ? recipe.notes.split('\n') : [])

	let scaledServings = $state(null) // ✅ Use $state instead of $derived

	$effect(() => {
		scaledServings = recipe.servings ? scaleNumbersInString(recipe.servings, scale) : null
	})

	let sanitizedDirections = $state([])
	let sanitizedNotes = $state([])
	let sanitizedIngredients = $state([])
	let hasAdditional

	let isMounted = $state(false)

	onMount(() => {
		isMounted = true
	})

	function updateLogs(newLog, response) {
		if (response.success) {
			recipeFeedback = 'You cooked this recipe!'
		} else {
			recipeFeedback = 'Failed to add to cooked log!'
		}
		logs = [...logs, newLog]
		logs = sortByDate(logs, 'cooked', 'desc')
	}

	function favRecipe(success) {
		if (success) {
			recipe.on_favorites = !recipe.on_favorites
			recipe.on_favorites
				? (recipeFeedback = 'Recipe favourited!')
				: (recipeFeedback = 'Recipe unfavourited!')
		} else {
			recipeFeedback = 'Failed to favourite!'
		}
	}

	function pubRecipe(success) {
		if (success) {
			recipe.is_public = !recipe.is_public
			recipe.is_public
				? (recipeFeedback = 'Recipe Made Public!')
				: (recipeFeedback = 'Recipe Made Private!')
		} else {
			recipeFeedback = 'Failed to change public status!'
		}
	}

	async function handleNoteUpdated(logId, note) {
		try {
			const response = await fetch(`/api/log/${logId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ note })
			})
			if (response.ok) {
				logs = logs.map((log) => (log.id === logId ? { ...log, note } : log))
				recipeFeedback = 'Note updated!'
			} else {
				recipeFeedback = 'Failed to update note!'
			}
		} catch (err) {
			console.error('Error updating note:', err)
			recipeFeedback = 'Failed to update note!'
		}
	}

	function handleRecipeRatingChanged(newRating) {
		recipeRatingChange(newRating, recipe.uid)
		recipe.rating = newRating
	}

	async function handleSetMainPhoto(photoId) {
		recipe.photos = recipe.photos.map((photo) => ({
			...photo,
			isMain: photo.id === photoId
		}))
		const photosWithFileType = recipe.photos.filter((p) => p.fileType)
		const success = await updatePhotos(photosWithFileType)
		if (!success) {
			console.error('Failed to set the main photo.')
		}
	}

	let isLatest = true

	const sanitizeContent = async () => {
		isLatest = false // Reset flag when starting a new invocation
		const currentInvocation = {}
		isLatest = currentInvocation

		const directionsResult = await Promise.all(
			parseRecipeText(
				directionLines,
				selectedSystem,
				measurementSystem.system,
				convertedIngredients,
				viewUser.language
			).map((direction) => getSanitizedHTML(direction))
		)

		const notesResult = await Promise.all(
			parseRecipeText(
				notesLines,
				selectedSystem,
				measurementSystem.system,
				null,
				viewUser.language
			).map((note) => getSanitizedHTML(note))
		)

		if (currentInvocation !== isLatest) return // Ignore results if this isn't the latest invocation
		sanitizedDirections = directionsResult
		sanitizedNotes = notesResult

		const tempIngredientsResult = await Promise.all(
			convertedIngredients.map(async (ingredient) => {
				return {
					...ingredient,
					ingredient: await getSanitizedHTML(ingredient.ingredient)
				}
			})
		)

		if (currentInvocation !== isLatest) return // Ignore results if this isn't the latest invocation
		sanitizedIngredients = tempIngredientsResult
		hasAdditional = sanitizedIngredients.some((item) => item.additional !== null)
		isLoading = false
	}

	$effect(() => {
		if (isMounted && selectedSystem && convertedIngredients) {
			sanitizeContent()
		}
	})

	$effect(() => {
		if (!isMounted || !selectedSystem) return

		if (selectedSystem === measurementSystem.system) {
			console.log('from system === to system')
			convertedIngredients = ingredientsArray.map((ing) =>
				normalizeIngredient(ing, {}, viewUser.language)
			)
			loadingIngredients = false
		} else {
			handleIngAPIFetch(measurementSystem, selectedSystem)
		}
	})

	// Prevent Screen from Sleeping
	onMount(() => {
		setupWakeLock()
	})

	onDestroy(() => {
		cleanupWakeLock()
	})
</script>

{#if viewOnly}
	<div class="mb-4">
		<h3 class="text-2xl font-semibold">{recUser.username}'s Recipe</h3>
	</div>
{/if}
<FeedbackMessage message={recipeFeedback} />
<div class="flex flex-wrap justify-between gap-1 my-4 w-full md:gap-2 md:justify-end">
	<RecipeViewButtons
		{recipe}
		{updateLogs}
		{favRecipe}
		{pubRecipe}
		{logs}
		{viewOnly}
		{scale}
		viewerUserId={viewUser?.userId}
		onRestoreScale={handleScaleChange} />
</div>

{#if isLoading}
	<div class="flex justify-center items-center p-8">
		<span class="loading loading-spinner loading-lg text-primary"></span>
		<span class="ml-4 text-lg">Waiting for the pan to boil...</span>
	</div>
{:else}
	<!-- Row 1: Image + About Card -->
	<div class="flex flex-col md:flex-row gap-4 my-4">
		{#if mainPhoto}
			<div class="w-full md:w-1/3">
				<RecipeViewCover {mainPhoto} {recipe} />
			</div>
		{/if}
		<div class="w-full {mainPhoto ? 'md:w-2/3' : ''}">
			<RecipeViewAbout
				{recipe}
				{categories}
				useCats={viewUser?.useCats}
				{scaledServings}
				recipeRatingChanged={handleRecipeRatingChanged} />
		</div>
	</div>

	<!-- Row 2: Ingredients + Description/Directions -->
	<div class="flex flex-col md:flex-row gap-4 my-4">
		<div class="w-full md:w-1/3">
			{#if !loadingIngredients}
				<RecipeViewIngs
					{ingredients}
					recipeUid={recipe.uid}
					{sanitizedIngredients}
					{scale}
					user={viewUser}
					{measurementSystem}
					{selectedSystem}
					onScaleChange={handleScaleChange}
					onSelectedSystemChange={handleSelectedSystemChange} />
			{:else}
				<div class="flex justify-center items-center p-8">
					<span class="loading loading-spinner loading-md text-primary"></span>
					<span class="ml-4">Getting ingredients ready...</span>
				</div>
			{/if}
		</div>

		<div class="w-full md:w-2/3">
			<RecipeViewDesc {recipe} />
			{#if recipe.directions_original}
				<div class="flex items-center gap-2 mt-6 mb-2">
					<span class="text-sm">Summarized</span>
					<Toggle bind:checked={showOriginalDirections} size="sm" />
					<span class="text-sm">Original</span>
				</div>
			{/if}
			<RecipeViewDirections {directionLines} {sanitizedDirections} {loadingIngredients} />
		</div>
	</div>
	<RecipeViewNotes
		{notesLines}
		{sanitizedNotes}
		logs={viewOnly ? [] : logs}
		onNoteUpdated={viewOnly ? undefined : handleNoteUpdated} />
{/if}

<RecipeViewOtherPhotos
	{otherPhotos}
	recipeName={recipe.name}
	onSetMainPhoto={handleSetMainPhoto}
	{viewOnly} />
