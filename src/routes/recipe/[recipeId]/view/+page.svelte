<script>
	import { ingredientProcess, scaleNumbersInString } from '$lib/utils/filters'
	import { determineSystem, parseDirections, convertIngredients } from '$lib/utils/converter'
	import { getSanitizedHTML } from '$lib/utils/render'
	import { onMount } from 'svelte'

	import RecipeViewButtons from '$lib/components/RecipeViewButtons.svelte'
	import RecipeViewCover from '$lib/components/RecipeViewCover.svelte'
	import RecipeViewAbout from '$lib/components/RecipeViewAbout.svelte'
	import RecipeViewDesc from '$lib/components/RecipeViewDesc.svelte'
	import RecipeViewIng from '$lib/components/RecipeViewIngs.svelte'
	import RecipeViewOtherPhotos from '$lib/components/RecipeViewOtherPhotos.svelte'
	import RecipeViewDirections from '$lib/components/RecipeViewDirections.svelte'

	export let data
	let isLoading = true

	let { recipe, categories, viewUser, viewMode } = data
	console.log('🚀 ~ file: +page.svelte:19 ~ viewUser:', viewUser)
	console.log('🚀 ~ file: +page.svelte:19 ~ viewMode:', viewMode)

	let ingredients = []
	let ingredientsArray = []

	// Scaling factor for the ingredients
	let scale = 1
	let scaledServings

	let directionLines = []
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

	/** Logic to update various variables based on the recipe data. */
	$: if (data && data.recipe) {
		ingredients = recipe.ingredients ? recipe.ingredients.split('\n') : []
		ingredientsArray = ingredientProcess(ingredients)
		measurementSystem = determineSystem(ingredientsArray)
		convertedIngredients = convertIngredients(
			ingredientsArray,
			measurementSystem.system,
			selectedSystem
		)
		// Call the function to update selectedSystem based on the initial measurementSystem
		recipe.directions ? (directionLines = recipe.directions.split('\n')) : null
		scaledServings = recipe.servings ? scaleNumbersInString(recipe.servings, scale) : null
	}

	let sanitizedDirections = []
	let sanitizedIngredients = []
	let hasAdditional

	let isMounted = false

	onMount(() => {
		isMounted = true
	})

	const sanitizeContent = async () => {
		// Use Promise.all to await all asynchronous operations
		sanitizedDirections = await Promise.all(
			parseDirections(directionLines, selectedSystem, measurementSystem.system).map((direction) =>
				getSanitizedHTML(direction)
			)
		)

		const tempIngredients = await Promise.all(
			convertedIngredients.map(async (ingredient) => {
				return {
					...ingredient,
					ingredient: await getSanitizedHTML(ingredient.ingredient)
				}
			})
		)
		sanitizedIngredients = tempIngredients
		hasAdditional = sanitizedIngredients.some((item) => item.additional !== null)
		isLoading = false
	}

	$: if (isMounted) {
		sanitizeContent()
	}
</script>

{#if !viewMode}
	<div id="recipe-buttons">
		{#if recipe.userId === viewUser.userId}
			<RecipeViewButtons {recipe} />
		{/if}
	</div>
{/if}

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
</style>
