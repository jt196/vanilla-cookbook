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
	import RecipeViewNutrition from '$lib/components/recipe/RecipeViewNutrition.svelte'
	import RecipeViewOtherPhotos from '$lib/components/recipe/RecipeViewOtherPhotos.svelte'
	import RecipeViewDirections from '$lib/components/recipe/RecipeViewDirections.svelte'
	import RecipeViewNotes from '$lib/components/recipe/RecipeViewNotes.svelte'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import Toggle from '$lib/components/ui/Form/Toggle.svelte'
	import Carousel from '$lib/components/ui/Carousel.svelte'
	import CarouselItem from '$lib/components/ui/CarouselItem.svelte'
	import RecipePhotoCard from '$lib/components/recipe/RecipePhotoCard.svelte'
	import { sortByDate } from '$lib/utils/sorting.js'
	import { recipeRatingChange, updatePhotos } from '$lib/utils/crud.js'

	/** @type {{data: any}} */
	let { data = $bindable() } = $props()
	let isLoading = $state(true)

	let { recipe, viewUser, logs, recUser, aiEnabled, semanticEnabled } = $state(data)
	$effect(() => {
		;({ recipe, viewUser, logs, recUser, aiEnabled, semanticEnabled } = data)
	})

	let similarRecipes = $state(/** @type {Array<{uid:string,name:string,photos:Array<{id:string}>,image_url?:string}>} */ ([]))

	const showSimilarStrip = $derived(
		semanticEnabled && (viewUser?.showSimilarRecipes ?? true)
	)

	// Scaling factor for the ingredients
	let scale = $state(1)

	let convertedIngredients = $state([])

	let recipeFeedback = $state('')

	let selectedSystem = $state(null)

	let mainPhoto = $state()

	let otherPhotos = $state([])

	let loadingIngredients = $state(true)
	let cleaningNutrition = $state(false)

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

	onMount(async () => {
		isMounted = true
		if (showSimilarStrip) {
			try {
				const res = await fetch(`/api/recipe/${recipe.uid}/similar?limit=6`)
				if (res.ok) {
					const body = await res.json()
					similarRecipes = body.results ?? []
				}
			} catch (err) {
				console.error('Failed to load similar recipes:', err)
			}
		}
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

	async function handleLogUpdated(logId, note, scale) {
		const numericScale = Number(scale) || 1
		try {
			const response = await fetch(`/api/log/${logId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ note, scale: numericScale })
			})
			if (response.ok) {
				logs = logs.map((log) => (log.id === logId ? { ...log, note, scale: numericScale } : log))
				recipeFeedback = 'Cooking log updated!'
			} else {
				recipeFeedback = 'Failed to update cooking log!'
			}
		} catch (err) {
			console.error('Error updating cooking log:', err)
			recipeFeedback = 'Failed to update cooking log!'
		}
	}

	async function handleLogDeleted(logId) {
		try {
			const response = await fetch(`/api/log/${logId}`, {
				method: 'DELETE'
			})
			if (response.ok) {
				logs = logs.filter((log) => log.id !== logId)
				recipeFeedback = 'Cooking log deleted!'
			} else {
				recipeFeedback = 'Failed to delete cooking log!'
			}
		} catch (err) {
			console.error('Error deleting cooking log:', err)
			recipeFeedback = 'Failed to delete cooking log!'
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

	async function handleCleanNutritionInView() {
		if (viewOnly || !recipe?.nutritional_info?.trim()) return

		cleaningNutrition = true
		try {
			const response = await fetch('/api/recipe/cleanup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'nutrition',
					content: recipe.nutritional_info,
					language: viewUser.language
				})
			})

			if (!response.ok) {
				throw new Error('Nutrition cleanup failed')
			}

			const data = await response.json()
			if (typeof data.text === 'string' && data.text.trim()) {
				recipe.nutritional_info = data.text
				recipeFeedback =
					data.source === 'fallback' ? 'Nutrition cleaned (local parser).' : 'Nutrition cleaned.'
			} else {
				recipeFeedback = 'No nutrition changes applied.'
			}
		} catch (error) {
			console.error('Nutrition cleanup failed:', error)
			recipeFeedback = 'Failed to clean nutrition.'
		} finally {
			cleaningNutrition = false
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
		onRestoreScale={handleScaleChange}
		onLogUpdated={viewOnly ? undefined : handleLogUpdated}
		onLogDeleted={viewOnly ? undefined : handleLogDeleted}
	/>
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
					{scaledServings}
					recipeRatingChanged={handleRecipeRatingChanged}
				/>
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
					onSelectedSystemChange={handleSelectedSystemChange}
				/>
				{#if viewUser?.displayNutrition ?? true}
					<div class="hidden md:block">
						<RecipeViewNutrition
							nutritionalInfo={recipe.nutritional_info}
							{scale}
							language={viewUser.language}
							recipeUid={recipe.uid}
							showCleanupAction={!viewOnly && aiEnabled}
							cleanupInProgress={cleaningNutrition}
							onCleanup={viewOnly ? null : handleCleanNutritionInView}
						/>
					</div>
				{/if}
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
			<RecipeViewNotes {notesLines} {sanitizedNotes} logs={viewOnly ? [] : logs} />
		</div>
	</div>

	{#if viewUser?.displayNutrition ?? true}
		<div class="md:hidden">
			<RecipeViewNutrition
				nutritionalInfo={recipe.nutritional_info}
				{scale}
				language={viewUser.language}
				recipeUid={recipe.uid}
				showCleanupAction={!viewOnly && aiEnabled}
				cleanupInProgress={cleaningNutrition}
				onCleanup={viewOnly ? null : handleCleanNutritionInView}
			/>
		</div>
	{/if}
{/if}

<RecipeViewOtherPhotos
	{otherPhotos}
	recipeName={recipe.name}
	onSetMainPhoto={handleSetMainPhoto}
	{viewOnly}
/>

{#if showSimilarStrip && similarRecipes.length > 0}
	<div class="mt-8">
		<h3 class="text-lg font-semibold mb-3">Similar Recipes</h3>
		<Carousel>
			{#each similarRecipes as r (r.uid)}
				<CarouselItem>
					<RecipePhotoCard recipe={r} />
				</CarouselItem>
			{/each}
		</Carousel>
	</div>
{/if}
