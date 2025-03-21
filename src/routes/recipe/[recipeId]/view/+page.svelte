<script>
	import { ingredientProcess, scaleNumbersInString } from '$lib/utils/filters'
	import { normalizeIngredient } from '$lib/utils/converter'
	import { determineSystem, parseRecipeText } from '$lib/utils/converter'
	import { getSanitizedHTML } from '$lib/utils/render'
	import { onMount, onDestroy } from 'svelte'
	import { setupWakeLock, cleanupWakeLock } from '$lib/utils/wakeLock.js'
	import { browser } from '$app/environment'

	import RecipeViewButtons from '$lib/components/RecipeViewButtons.svelte'
	import RecipeViewCover from '$lib/components/RecipeViewCover.svelte'
	import RecipeViewAbout from '$lib/components/RecipeViewAbout.svelte'
	import RecipeViewDesc from '$lib/components/RecipeViewDesc.svelte'
	import RecipeViewIngs from '$lib/components/RecipeViewIngs.svelte'
	import RecipeViewOtherPhotos from '$lib/components/RecipeViewOtherPhotos.svelte'
	import RecipeViewDirections from '$lib/components/RecipeViewDirections.svelte'
	import RecipeViewNotes from '$lib/components/RecipeViewNotes.svelte'
	import Back from '$lib/components/svg/Back.svelte'
	import RecipeViewLogs from '$lib/components/RecipeViewLogs.svelte'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import { sortByDate } from '$lib/utils/sorting.js'
	import { recipeRatingChange } from '$lib/utils/crud.js'

	/** @type {{data: any}} */
	let { data } = $props()
	let isLoading = $state(true)

	let { recipe, categories, viewUser, logs } = $state(data)

	// Scaling factor for the ingredients
	let scale = $state(1)

	let convertedIngredients = $state([])

	let recipeFeedback = $state('')

	let selectedSystem = $state(viewUser?.units)

	let mainPhoto = $state()

	let loadingIngredients = $state(true)

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
			mainPhoto =
				recipe.photos.find((photo) => photo.isMain) ||
				recipe.photos.find((photo) => !photo.isMain && photo.url === null) ||
				recipe.photos.find((photo) => !photo.isMain)
		}
	})

	let otherPhotos = recipe.photos
		? recipe.photos.filter((photo) => photo !== mainPhoto && photo.url === null)
		: []

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
					skipSmallUnits: viewUser.skipSmallUnits
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
	let ingredientsArray = $derived(ingredientProcess(ingredients))
	let measurementSystem = $derived(determineSystem(ingredientsArray))
	let directionLines = $derived(recipe.directions ? recipe.directions.split('\n') : [])
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

	function handleRecipeRatingChanged(newRating) {
		recipeRatingChange(newRating, recipe.uid)
		recipe.rating = newRating
	}

	let isLatest = true

	const sanitizeContent = async () => {
		isLatest = false // Reset flag when starting a new invocation
		const currentInvocation = {}
		isLatest = currentInvocation

		const directionsResult = await Promise.all(
			parseRecipeText(directionLines, selectedSystem, measurementSystem.system).map((direction) =>
				getSanitizedHTML(direction)
			)
		)

		const notesResult = await Promise.all(
			parseRecipeText(notesLines, selectedSystem, measurementSystem.system).map((note) =>
				getSanitizedHTML(note)
			)
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
			convertedIngredients = ingredientsArray.map(normalizeIngredient)
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

<div id="recipe-buttons">
	<div class="home-button">
		<button class="outline contrast" data-tooltip="Go to recipe list"
			><a href="/"><Back width="20px" height="20px" fill="var(--pico-primary)" /></a></button>
		<FeedbackMessage message={recipeFeedback} />
	</div>
	{#if recipe.userId === viewUser.userId}
		<RecipeViewButtons {recipe} {updateLogs} {favRecipe} {logs} />
	{/if}
</div>

{#if isLoading}
	<div aria-busy="true">Waiting for the pan to boil...</div>
{:else}
	<div class="recipe-details">
		<div class="recipe-image">
			<RecipeViewCover {mainPhoto} {recipe} />
		</div>
		<div class="recipe-about">
			<RecipeViewAbout
				{recipe}
				{categories}
				{scaledServings}
				recipeRatingChanged={handleRecipeRatingChanged} />
		</div>
	</div>
	<div class="recipe-main">
		<div class="recipe-ingredients">
			{#if !loadingIngredients}
				<RecipeViewIngs
					{ingredients}
					recipeUid={recipe.uid}
					{sanitizedIngredients}
					{scale}
					userIsAdmin={viewUser.isAdmin}
					{measurementSystem}
					{selectedSystem}
					onScaleChange={handleScaleChange}
					onSelectedSystemChange={handleSelectedSystemChange} />
			{:else}
				<div aria-busy="true">Getting ingredients ready...</div>
			{/if}
		</div>
		<div class="recipe-text">
			<RecipeViewDesc {recipe} />
			<RecipeViewDirections {directionLines} {sanitizedDirections} />
		</div>
	</div>
	<RecipeViewNotes {notesLines} {sanitizedNotes} />
	{#if logs && logs.length > 0}
		<RecipeViewLogs {logs} />
	{/if}
{/if}

<RecipeViewOtherPhotos {otherPhotos} recipeName={recipe.name} />

<style lang="scss">
	.recipe-main,
	.recipe-details {
		margin: 1rem 0;
		display: flex;
		gap: 1rem;
		@media (max-width: 767px) {
			flex-direction: column;
		}
	}

	.recipe-ingredients,
	.recipe-image {
		flex: 1;
	}
	.recipe-text,
	.recipe-about {
		flex: 2;
	}

	#recipe-buttons {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin: 1rem 0 1rem 0;
	}

	#recipe-buttons .home-button {
		margin-right: auto; /* this pushes everything else to the right */
		display: flex;
		gap: 2rem;
		justify-content: center;
		align-items: center;
	}
</style>
