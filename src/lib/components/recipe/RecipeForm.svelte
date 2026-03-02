<script>
	import { checkImageExistence } from '$lib/utils/image/imageUtils'
	import { onMount } from 'svelte'
	import { franc } from 'franc'
	import {
		getLanguageDisplayName,
		normalizeLanguageCode
	} from '$lib/submodules/recipe-ingredient-parser/src/i18n'

	import PhotoSection from '$lib/components/recipe/PhotoSection.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Textarea from '$lib/components/ui/Form/Textarea.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import InfoText from '$lib/components/ui/InfoText.svelte'
	import Spinner from '$lib/components/ui/Spinner.svelte'
	import Bolt from '$lib/components/svg/Bolt.svelte'
	import Undo from '$lib/components/svg/Undo.svelte'

	/** @type {{recipe: any, onSubmit: any, buttonText?: string, selectedFiles?: any, onSelectedFilesChange?: any, baseUrl?: string, editMode?: boolean, recipeCategories?: any, aiEnabled?: boolean, aiProvider?: string | null, aiSelectedProvider?: string | null, aiSelectedProviderConfigured?: boolean, isAdmin?: boolean, userUnits?: string, userLanguage?: string, cancelHref?: string, onDelete?: (() => void) | null, saveImageUrl?: boolean}} */
	let {
		recipe = $bindable(),
		onSubmit,
		buttonText = 'Add Recipe',
		selectedFiles = $bindable([]),
		onSelectedFilesChange,
		baseUrl = '',
		editMode = false,
		recipeCategories = null,
		aiEnabled = false,
		aiProvider = null,
		aiSelectedProvider = null,
		aiSelectedProviderConfigured = false,
		isAdmin = false,
		userUnits = 'metric',
		userLanguage = 'eng',
		cancelHref = '',
		onDelete = null,
		saveImageUrl = $bindable(true)
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
	let imageChecked = $state(false)
	let cleaningIngredients = $state(false)
	let cleaningDirections = $state(false)
	let addingTips = $state(false)
	let cleaningNutrition = $state(false)
	let translatingRecipe = $state(false)

	const providerLabels = {
		openai: 'OpenAI',
		anthropic: 'Anthropic',
		google: 'Gemini',
		ollama: 'Ollama'
	}

	const aiWarningMessage = $derived.by(() => {
		if (isAdmin && aiSelectedProvider && !aiSelectedProviderConfigured) {
			const label = providerLabels[aiSelectedProvider] || aiSelectedProvider
			return `You selected ${label} as your provider, but no API key is configured in .env. Add a key or change provider in Admin settings.`
		}
		if (!aiEnabled) {
			return 'AI disabled.'
		}
		return ''
	})

	const aiWarningType = $derived(
		isAdmin && aiSelectedProvider && !aiSelectedProviderConfigured ? 'warning' : 'info'
	)

	const detectLanguage = (text) => {
		if (!text || typeof text !== 'string') return null
		const trimmed = text.trim()
		if (trimmed.length < 40) return null
		const detected = franc(trimmed, { minLength: 40 })
		if (!detected || detected === 'und') return null
		return {
			raw: detected,
			normalized: normalizeLanguageCode(detected) || detected
		}
	}

	const detectedLang = $derived.by(() => {
		const combined = [
			recipe?.name,
			recipe?.description,
			recipe?.ingredients,
			recipe?.directions,
			recipe?.notes
		]
			.filter(Boolean)
			.join('\n')
		return detectLanguage(combined)
	})

	const showTranslate = $derived(detectedLang && detectedLang.normalized !== userLanguage)

	// Undo state for AI cleanup
	let ingredientsBeforeClean = $state(null)
	let directionsBeforeSummarize = $state(null)
	let notesBeforeTips = $state(null)
	let nutritionBeforeClean = $state(null)

	async function handleCleanIngredients() {
		if (!recipe.ingredients || recipe.ingredients.trim() === '') return

		cleaningIngredients = true
		// Store original for undo
		ingredientsBeforeClean = recipe.ingredients

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

			if (response.status === 429) {
				throw new Error('Rate limit reached. Please wait a moment before trying again.')
			}
			if (!response.ok) {
				throw new Error('Cleanup failed')
			}

			const data = await response.json()
			if (data.ingredients) {
				// Store original in recipe if not already set
				if (!recipe.ingredients_original) {
					recipe.ingredients_original = ingredientsBeforeClean
				}
				recipe.ingredients = data.ingredients.join('\n')
			}
		} catch (err) {
			console.error('Ingredient cleanup failed:', err)
			alert(err.message || 'Failed to clean ingredients. Please try again.')
			ingredientsBeforeClean = null // Clear on failure
		} finally {
			cleaningIngredients = false
		}
	}

	function undoCleanIngredients() {
		if (ingredientsBeforeClean) {
			recipe.ingredients = ingredientsBeforeClean
			ingredientsBeforeClean = null
		}
	}

	function restoreOriginalIngredients() {
		if (recipe.ingredients_original) {
			recipe.ingredients = recipe.ingredients_original
			recipe.ingredients_original = ''
		}
	}

	async function handleSummarizeDirections() {
		if (!recipe.directions || recipe.directions.trim() === '') return

		cleaningDirections = true
		// Store original for undo
		directionsBeforeSummarize = recipe.directions

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

			if (response.status === 429) {
				throw new Error('Rate limit reached. Please wait a moment before trying again.')
			}
			if (!response.ok) {
				throw new Error('Cleanup failed')
			}

			const data = await response.json()
			if (data.instructions) {
				// Store original in recipe if not already set
				if (!recipe.directions_original) {
					recipe.directions_original = directionsBeforeSummarize
				}
				recipe.directions = data.instructions.join('\n\n')
			}
		} catch (err) {
			console.error('Direction summarization failed:', err)
			alert(err.message || 'Failed to summarize directions. Please try again.')
			directionsBeforeSummarize = null // Clear on failure
		} finally {
			cleaningDirections = false
		}
	}

	async function handleTranslateRecipe() {
		if (!recipe) return
		const hasContent =
			(recipe.ingredients && recipe.ingredients.trim() !== '') ||
			(recipe.directions && recipe.directions.trim() !== '') ||
			(recipe.notes && recipe.notes.trim() !== '') ||
			(recipe.name && recipe.name.trim() !== '') ||
			(recipe.description && recipe.description.trim() !== '')

		if (!hasContent) return

		translatingRecipe = true

		try {
			const payload = {
				recipe: {
					name: recipe.name || '',
					author: recipe.author || '',
					sourceUrl: recipe.source_url || '',
					imageUrl: recipe.image_url || '',
					description: recipe.description || '',
					notes: recipe.notes || '',
					ingredients: recipe.ingredients
						? recipe.ingredients
								.split('\n')
								.map((l) => l.trim())
								.filter(Boolean)
						: [],
					instructions: recipe.directions
						? recipe.directions
								.split('\n')
								.map((l) => l.trim())
								.filter(Boolean)
						: [],
					cookTime: recipe.cook_time || '',
					prepTime: recipe.prep_time || '',
					totalTime: recipe.total_time || '',
					servings: recipe.servings || '',
					nutrition: recipe.nutritional_info ? { text: recipe.nutritional_info } : {}
				},
				language: userLanguage,
				fromLanguage: detectedLang?.normalized ?? null
			}

			const response = await fetch('/api/recipe/translate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			})

			if (!response.ok) {
				throw new Error('Translation failed')
			}

			const data = await response.json()
			const translated = data?.recipe
			if (!translated) {
				throw new Error('Translation failed - invalid response')
			}

			if (translated.name) recipe.name = translated.name
			if (translated.description) recipe.description = translated.description
			if (Array.isArray(translated.ingredients)) {
				recipe.ingredients = translated.ingredients.join('\n')
			}
			if (Array.isArray(translated.instructions)) {
				recipe.directions = translated.instructions.join('\n')
			}
			if (translated.notes) recipe.notes = translated.notes
			if (translated.nutrition) {
				if (typeof translated.nutrition === 'string') {
					recipe.nutritional_info = translated.nutrition
				} else if (translated.nutrition.text) {
					recipe.nutritional_info = translated.nutrition.text
				}
			}
		} catch (err) {
			console.error('Recipe translation failed:', err)
			alert('Failed to translate recipe. Please try again.')
		} finally {
			translatingRecipe = false
		}
	}

	async function handleCleanNutrition() {
		if (!recipe.nutritional_info || recipe.nutritional_info.trim() === '') return

		cleaningNutrition = true
		nutritionBeforeClean = recipe.nutritional_info

		try {
			const response = await fetch('/api/recipe/cleanup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'nutrition',
					content: recipe.nutritional_info,
					language: userLanguage
				})
			})

			if (response.status === 429) {
				throw new Error('Rate limit reached. Please wait a moment before trying again.')
			}
			if (!response.ok) {
				throw new Error('Cleanup failed')
			}

			const data = await response.json()
			if (typeof data.text === 'string' && data.text.trim()) {
				recipe.nutritional_info = data.text
			}
		} catch (err) {
			console.error('Nutrition cleanup failed:', err)
			alert(err.message || 'Failed to clean nutrition information. Please try again.')
			nutritionBeforeClean = null
		} finally {
			cleaningNutrition = false
		}
	}

	function undoCleanNutrition() {
		if (nutritionBeforeClean) {
			recipe.nutritional_info = nutritionBeforeClean
			nutritionBeforeClean = null
		}
	}

	function undoSummarizeDirections() {
		if (directionsBeforeSummarize) {
			recipe.directions = directionsBeforeSummarize
			directionsBeforeSummarize = null
		}
	}

	async function handleAddTips() {
		addingTips = true
		notesBeforeTips = recipe.notes || ''

		try {
			const content = `Recipe: ${recipe.name || ''}\n\nIngredients:\n${recipe.ingredients || ''}\n\nDirections:\n${recipe.directions || ''}`
			const response = await fetch('/api/recipe/cleanup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'suggestions', content })
			})

			if (response.status === 429) throw new Error('Rate limit reached. Please wait a moment before trying again.')
		if (!response.ok) throw new Error('Tips generation failed')

			const data = await response.json()
			if (data.text) {
				recipe.notes =
					recipe.notes && recipe.notes.trim()
						? recipe.notes.trimEnd() + '\n\n' + data.text
						: data.text
			}
		} catch (err) {
			console.error('Tips generation failed:', err)
			alert(err.message || 'Failed to generate tips. Please try again.')
			notesBeforeTips = null
		} finally {
			addingTips = false
		}
	}

	function undoAddTips() {
		if (notesBeforeTips !== null) {
			recipe.notes = notesBeforeTips
			notesBeforeTips = null
		}
	}

	function restoreOriginalDirections() {
		if (recipe.directions_original) {
			recipe.directions = recipe.directions_original
			recipe.directions_original = ''
		}
	}

	function handleRatingChange(event) {
		recipe.rating = event.detail
		console.log('New Rating:', recipe.rating)
	}

	$effect(() => {
		if (recipe.image_url && baseUrl) {
			imageChecked = false
			checkImageExistence(recipe.image_url, baseUrl).then((result) => {
				imageExists = result
				imageChecked = true
			})
		}
	})
</script>

<InfoText class="my-4">
	<a target="_blank" href="https://www.markdownguide.org/basic-syntax/">Markdown</a> is supported for
	directions and notes, headers work in ingredients.
</InfoText>

<form onsubmit={onSubmit} class="flex flex-col gap-5">
	<div>
		{#if !editMode}
			<h3>New Recipe</h3>
		{:else}
			<h3>Editing: {recipe.name}</h3>
		{/if}
		<div class="flex gap-2 mt-2">
			{#if cancelHref}
				<a href={cancelHref} class="btn btn-soft btn-secondary btn-sm">Cancel</a>
			{/if}
			{#if onDelete}
				<Button type="button" size="sm" style="soft" color="error" onclick={onDelete}
					>Delete</Button>
			{/if}
			<Button type="submit" size="sm">{buttonText}</Button>
		</div>
		{#if aiWarningMessage}
			<FeedbackMessage message={aiWarningMessage} type={aiWarningType} inline={true} timeout={0} />
		{/if}
		{#if aiEnabled && showTranslate}
			<div class="mt-2">
				<Button
					type="button"
					size="sm"
					style="soft"
					onclick={handleTranslateRecipe}
					disabled={translatingRecipe}>
					{#if translatingRecipe}
						<Spinner visible={true} size="xs" type="dots" />
						Translating...
					{:else}
						<Bolt width="16px" height="16px" />
						Translate
					{/if}
				</Button>
				{#if detectedLang && detectedLang.normalized !== userLanguage}
					<InfoText class="mt-1">
						Detected {getLanguageDisplayName(detectedLang.raw, userLanguage)}. Translate to{' '}
						{getLanguageDisplayName(userLanguage, userLanguage)}.
					</InfoText>
				{/if}
			</div>
		{/if}
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
		<PhotoSection
			{recipe}
			{imageExists}
			{imageChecked}
			{selectedFiles}
			{onSelectedFilesChange}
			bind:saveImageUrl />
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
				<div class="flex gap-2 mt-2">
					{#if recipe.ingredients_original}
						<Button
							type="button"
							size="sm"
							style="outline"
							color="warning"
							onclick={restoreOriginalIngredients}>
							<Undo width="16px" height="16px" />
							Restore Original
						</Button>
					{:else}
						<Button
							type="button"
							size="sm"
							style="soft"
							onclick={handleCleanIngredients}
							disabled={cleaningIngredients ||
								!recipe.ingredients ||
								recipe.ingredients.trim() === ''}>
							{#if cleaningIngredients}
								<Spinner visible={true} size="xs" type="dots" />
								Cleaning...
							{:else}
								<Bolt width="16px" height="16px" />
								Clean Ingredients
							{/if}
						</Button>
						{#if ingredientsBeforeClean}
							<Button
								type="button"
								size="sm"
								style="outline"
								color="secondary"
								onclick={undoCleanIngredients}>
								<Undo width="16px" height="16px" />
								Undo
							</Button>
						{/if}
					{/if}
				</div>
				{#if recipe.ingredients_original}
					<InfoText class="mt-1">Restore the original uncleaned ingredients.</InfoText>
				{:else}
					<InfoText class="mt-1"
						>Simplify complex ingredients for more accurate conversion results.</InfoText>
				{/if}
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
				<div class="flex gap-2 mt-2">
					{#if recipe.directions_original}
						<Button
							type="button"
							size="sm"
							style="outline"
							color="warning"
							onclick={restoreOriginalDirections}>
							<Undo width="16px" height="16px" />
							Restore Original
						</Button>
					{:else}
						<Button
							type="button"
							size="sm"
							style="soft"
							onclick={handleSummarizeDirections}
							disabled={cleaningDirections ||
								!recipe.directions ||
								recipe.directions.trim() === ''}>
							{#if cleaningDirections}
								<Spinner visible={true} size="xs" type="dots" />
								Summarizing...
							{:else}
								<Bolt width="16px" height="16px" />
								Summarize Directions
							{/if}
						</Button>
						{#if directionsBeforeSummarize}
							<Button
								type="button"
								size="sm"
								style="outline"
								color="secondary"
								onclick={undoSummarizeDirections}>
								<Undo width="16px" height="16px" />
								Undo
							</Button>
						{/if}
					{/if}
				</div>
				{#if recipe.directions_original}
					<InfoText class="mt-1">Restore the original unsummarized directions.</InfoText>
				{:else}
					<InfoText class="mt-1">Condense lengthy directions into clear, concise steps.</InfoText>
				{/if}
			{/if}
		</div>
		<Textarea
			id="notes"
			name="notes"
			rows="3"
			placeholder="Don't overcook the pasta or she'll come back to haunt you"
			bind:value={recipe.notes}
			label="Notes" />
		{#if aiEnabled}
			<div class="flex gap-2 mt-2">
				<Button
					type="button"
					size="sm"
					style="soft"
					onclick={handleAddTips}
					disabled={addingTips || (!recipe.ingredients && !recipe.directions)}>
					{#if addingTips}
						<Spinner visible={true} size="xs" type="dots" />
						Adding Tips...
					{:else}
						<Bolt width="16px" height="16px" />
						Add Tips
					{/if}
				</Button>
				{#if notesBeforeTips !== null}
					<Button
						type="button"
						size="sm"
						style="outline"
						color="secondary"
						onclick={undoAddTips}>
						<Undo width="16px" height="16px" />
						Undo
					</Button>
				{/if}
			</div>
			<InfoText class="mt-1">Suggest substitutions and additions based on the recipe.</InfoText>
		{/if}
		<Textarea
			id="nutritional_info"
			name="nutritional_info"
			rows="3"
			bind:value={recipe.nutritional_info}
			label="Nutritional Information" />
		{#if aiEnabled}
			<div class="flex gap-2 mt-2">
				<Button
					type="button"
					size="sm"
					style="soft"
					onclick={handleCleanNutrition}
					disabled={cleaningNutrition ||
						!recipe.nutritional_info ||
						recipe.nutritional_info.trim() === ''}>
					{#if cleaningNutrition}
						<Spinner visible={true} size="xs" type="dots" />
						Cleaning...
					{:else}
						<Bolt width="16px" height="16px" />
						Clean Nutrition
					{/if}
				</Button>
				{#if nutritionBeforeClean}
					<Button
						type="button"
						size="sm"
						style="outline"
						color="secondary"
						onclick={undoCleanNutrition}>
						<Undo width="16px" height="16px" />
						Undo
					</Button>
				{/if}
			</div>
			<InfoText class="mt-1">Normalize nutrition into clean nutrient/value lines.</InfoText>
		{/if}
		<Button type="submit" size="sm" class="mt-4">{buttonText}</Button>
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
