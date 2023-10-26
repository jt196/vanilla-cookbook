<script>
	import { ingredientProcess, scaleNumbersInString } from '$lib/utils/filters'
	import { determineSystem, parseRecipeText } from '$lib/utils/converter'
	import { getSanitizedHTML } from '$lib/utils/render'
	import { onMount } from 'svelte'

	import RecipeViewButtons from '$lib/components/RecipeViewButtons.svelte'
	import RecipeViewCover from '$lib/components/RecipeViewCover.svelte'
	import RecipeViewAbout from '$lib/components/RecipeViewAbout.svelte'
	import RecipeViewDesc from '$lib/components/RecipeViewDesc.svelte'
	import RecipeViewIng from '$lib/components/RecipeViewIngs.svelte'
	import RecipeViewOtherPhotos from '$lib/components/RecipeViewOtherPhotos.svelte'
	import RecipeViewDirections from '$lib/components/RecipeViewDirections.svelte'
	import User from '$lib/components/svg/User.svelte'
	import RecipeViewNotes from '$lib/components/RecipeViewNotes.svelte'
	import List from '$lib/components/svg/List.svelte'

	export let data
	let isLoading = true

	let { recipe, categories, viewUser, viewMode } = data
	let ingredients = []
	let ingredientsArray = []

	// Scaling factor for the ingredients
	let scale = 1
	let scaledServings

	let directionLines = []
	let notesLines = []
	let measurementSystem = {}
	let convertedIngredients = {}

	let selectedSystem = viewUser?.units

	let mainPhoto

	$: {
		if (recipe && recipe.photos && recipe.photos.length > 0) {
			mainPhoto =
				recipe.photos.find((photo) => photo.isMain) ||
				recipe.photos.find((photo) => !photo.isMain && photo.url === null) ||
				recipe.photos.find((photo) => !photo.isMain)
		}
	}

	let otherPhotos = recipe.photos
		? recipe.photos.filter((photo) => photo !== mainPhoto && photo.url === null)
		: []

	// Function to handle the API fetch
	async function handleIngAPIFetch(measurementSystem, selectedSystem) {
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
			} else {
				console.error('API request failed:', response.statusText)
			}
		} catch (error) {
			console.error('Error:', error)
		}
	}

	/** Logic to update various variables based on the recipe data. */
	$: if (data && data.recipe) {
		ingredients = recipe.ingredients ? recipe.ingredients.split('\n') : []
		ingredientsArray = ingredientProcess(ingredients)
		measurementSystem = determineSystem(ingredientsArray)
		recipe.directions ? (directionLines = recipe.directions.split('\n')) : null
		recipe.notes ? (notesLines = recipe.notes.split('\n')) : null
		scaledServings = recipe.servings ? scaleNumbersInString(recipe.servings, scale) : null
	}

	let sanitizedDirections = []
	let sanitizedNotes = []
	let sanitizedIngredients = []
	let hasAdditional

	let isMounted = false

	onMount(() => {
		isMounted = true
	})

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

	$: if (isMounted && selectedSystem && convertedIngredients) {
		sanitizeContent()
	}

	$: if (isMounted && selectedSystem !== measurementSystem.system) {
		handleIngAPIFetch(measurementSystem, selectedSystem)
	} else {
		convertedIngredients = ingredientsArray
	}
</script>

<div id="recipe-buttons">
	<button class="home-button" data-tooltip="Go to recipe list"
		><a href="/"><List width="30px" height="30px" /></a></button>
	{#if recipe.userId === viewUser.userId}
		<RecipeViewButtons {recipe} />
	{/if}
</div>

{#if isLoading}
	<div aria-busy="true">Waiting for the kettle to boil...</div>
{:else}
	<div class="recipe-details">
		<RecipeViewCover {mainPhoto} {recipe} />
		<RecipeViewAbout {recipe} {categories} />
	</div>
	<div class="description">
		<RecipeViewDesc {recipe} />
	</div>
	<div class="recipe-main">
		<div class="ing-div">
			<RecipeViewIng
				{ingredients}
				{sanitizedIngredients}
				bind:scale
				bind:scaledServings
				userIsAdmin={viewUser.isAdmin}
				{measurementSystem}
				bind:selectedSystem />
		</div>
		<div class="recipe-text">
			<RecipeViewDirections {directionLines} {sanitizedDirections} />
		</div>
	</div>
	<RecipeViewNotes {notesLines} {sanitizedNotes} />
{/if}

<RecipeViewOtherPhotos {otherPhotos} recipeName={recipe.name} />

<style lang="scss">
	.recipe-main {
		margin-top: 2rem;
		display: flex;
		gap: 2rem;
		.recipe-text {
			flex: 2;
		}
		.ing-div {
			flex: 1;
		}
		@media (max-width: 767px) {
			flex-direction: column;
		}
	}

	.recipe-details {
		display: flex;
		gap: 2rem;
		@media (max-width: 767px) {
			flex-direction: column;
		}
	}
	#recipe-buttons {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	#recipe-buttons .home-button {
		margin-right: auto; /* this pushes everything else to the right */
	}
</style>
