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
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import InfoText from '$lib/components/ui/InfoText.svelte'
	import Spinner from '$lib/components/ui/Spinner.svelte'
	import Bolt from '$lib/components/svg/Bolt.svelte'
	import Undo from '$lib/components/svg/Undo.svelte'
	import { t } from '$lib/stores/locale.js'

	/** @type {{recipe: any, onSubmit: any, buttonText?: string, selectedFiles?: any, onSelectedFilesChange?: any, baseUrl?: string, editMode?: boolean, recipeCategories?: any, aiEnabled?: boolean, aiProvider?: string | null, aiSelectedProvider?: string | null, aiSelectedProviderConfigured?: boolean, isAdmin?: boolean, userUnits?: string, userLanguage?: string, cancelHref?: string, onDelete?: (() => void) | null, saveImageUrl?: boolean}} */
	let {
		recipe = $bindable(),
		onSubmit,
		buttonText = '',
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
	let generatingRecipeImage = $state(false)
	let imagePromptDialogOpen = $state(false)
	let imagePromptOverride = $state('')

	const DEFAULT_IMAGE_STYLE_DESCRIPTION =
		'Photo realistic plated dish, natural lighting, shallow depth of field, no text or watermark.'
	let errorMessage = $state('')
	let errorCode = $state(null)

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

	const resolvedButtonText = $derived(
		buttonText || (editMode ? $t('common.update') : $t('recipeForm.submitNew'))
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
	const canGenerateImage = $derived(
		editMode &&
			recipe?.uid &&
			((recipe?.name && recipe.name.trim() !== '') ||
				(recipe?.ingredients && recipe.ingredients.trim() !== '') ||
				(recipe?.directions && recipe.directions.trim() !== ''))
	)

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
			errorMessage = ''
			errorCode = null
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
				const err = await response.json().catch(() => ({}))
				throw Object.assign(new Error(err.error || 'Cleanup failed'), { code: err.code || null })
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
			errorMessage = err.message || ''
			errorCode = err.code || 'recipeForm.msg.cleanIngredientsFailed'
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
			errorMessage = ''
			errorCode = null
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
				const err = await response.json().catch(() => ({}))
				throw Object.assign(new Error(err.error || 'Cleanup failed'), { code: err.code || null })
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
			errorMessage = err.message || ''
			errorCode = err.code || 'recipeForm.msg.summarizeDirectionsFailed'
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
			errorMessage = ''
			errorCode = null
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
				const err = await response.json().catch(() => ({}))
				throw Object.assign(new Error(err.error || 'Translation failed'), {
					code: err.code || null
				})
			}

			const data = await response.json()
			const translated = data?.recipe
			if (!translated) {
				throw Object.assign(new Error('Translation failed - invalid response'), {
					code: 'recipeForm.msg.translateInvalidResponse'
				})
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
			errorMessage = err.message || ''
			errorCode = err.code || 'recipeForm.msg.translateFailed'
		} finally {
			translatingRecipe = false
		}
	}

	async function handleGenerateRecipeImage() {
		if (!canGenerateImage) return

		generatingRecipeImage = true
		try {
			errorMessage = ''
			errorCode = null
			const response = await fetch(`/api/recipe/${recipe.uid}/image/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					styleDescription: imagePromptOverride
				})
			})

			if (!response.ok) {
				const err = await response.json().catch(() => ({}))
				throw Object.assign(new Error(err.error || 'Image generation failed'), {
					code: err.code || null
				})
			}

			const data = await response.json()
			if (data?.photo?.id) {
				const currentPhotos = Array.isArray(recipe.photos) ? recipe.photos : []
				const mainExists = currentPhotos.some((photo) => photo?.isMain)
				const newPhoto = {
					...data.photo,
					isMain: mainExists ? false : true
				}
				recipe.photos = [newPhoto, ...currentPhotos]
				imagePromptDialogOpen = false
			}
		} catch (err) {
			console.error('Recipe image generation failed:', err)
			errorMessage = err.message || ''
			errorCode = err.code || 'recipeForm.msg.imageGenerateFailed'
		} finally {
			generatingRecipeImage = false
		}
	}

	async function handleCleanNutrition() {
		if (!recipe.nutritional_info || recipe.nutritional_info.trim() === '') return

		cleaningNutrition = true
		nutritionBeforeClean = recipe.nutritional_info

		try {
			errorMessage = ''
			errorCode = null
			const response = await fetch('/api/recipe/cleanup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'nutrition',
					content: recipe.nutritional_info,
					language: userLanguage
				})
			})

			if (!response.ok) {
				const err = await response.json().catch(() => ({}))
				throw Object.assign(new Error(err.error || 'Cleanup failed'), { code: err.code || null })
			}

			const data = await response.json()
			if (typeof data.text === 'string' && data.text.trim()) {
				recipe.nutritional_info = data.text
			}
		} catch (err) {
			console.error('Nutrition cleanup failed:', err)
			errorMessage = err.message || ''
			errorCode = err.code || 'recipeForm.msg.cleanNutritionFailed'
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
			errorMessage = ''
			errorCode = null
			const content = `Recipe: ${recipe.name || ''}\n\nIngredients:\n${recipe.ingredients || ''}\n\nDirections:\n${recipe.directions || ''}`
			const response = await fetch('/api/recipe/cleanup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'suggestions', content })
			})

			if (!response.ok) {
				const err = await response.json().catch(() => ({}))
				throw Object.assign(new Error(err.error || 'Tips generation failed'), {
					code: err.code || null
				})
			}

			const data = await response.json()
			if (data.text) {
				recipe.notes =
					recipe.notes && recipe.notes.trim()
						? recipe.notes.trimEnd() + '\n\n' + data.text
						: data.text
			}
		} catch (err) {
			console.error('Tips generation failed:', err)
			errorMessage = err.message || ''
			errorCode = err.code || 'recipeForm.msg.addTipsFailed'
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
	{$t('recipeForm.markdownNote')}
</InfoText>

<FeedbackMessage message={errorMessage} messageCode={errorCode} type="error" timeout={5000} />

<form onsubmit={onSubmit} class="flex flex-col gap-5">
	<div>
		{#if !editMode}
			<h3>{$t('recipeForm.titleNew')}</h3>
		{:else}
			<h3>{$t('recipeForm.titleEdit', { name: recipe.name })}</h3>
		{/if}
		<div class="flex gap-2 mt-2">
			{#if cancelHref}
				<a href={cancelHref} class="btn btn-soft btn-secondary btn-sm">{$t('common.cancel')}</a>
			{/if}
			{#if onDelete}
				<Button type="button" size="sm" style="soft" color="error" onclick={onDelete}
					>{$t('recipeForm.delete')}</Button>
			{/if}
			<Button type="submit" size="sm">{resolvedButtonText}</Button>
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
						{$t('recipeForm.translate')}
					{/if}
				</Button>
				{#if detectedLang && detectedLang.normalized !== userLanguage}
					<InfoText class="mt-1">
						{$t('recipeForm.translateDetected', {
							detected: getLanguageDisplayName(detectedLang.raw, userLanguage),
							target: getLanguageDisplayName(userLanguage, userLanguage)
						})}
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
					label={$t('recipeForm.name')}
					placeholder={$t('recipeForm.namePlaceholder')} />

				<Input
					type="text"
					id="source"
					name="source"
					bind:value={recipe.source}
					label={$t('recipeForm.source')}
					placeholder={$t('recipeForm.sourcePlaceholder')} />
				<Input
					type="text"
					id="source_url"
					name="source_url"
					placeholder="https://grannysrecipes.com"
					bind:value={recipe.source_url}
					label={$t('recipeForm.sourceUrl')} />
				<Input
					type="text"
					id="image_url"
					placeholder="https://grannysrecipes.com/norma.jpg"
					name="image_url"
					bind:value={recipe.image_url}
					label={$t('recipeForm.imageUrl')} />
			</div>

			<div class="form-col">
				<Input
					type="text"
					id="prep_time"
					name="prep_time"
					placeholder={$t('recipeForm.prepTimePlaceholder')}
					bind:value={recipe.prep_time}
					label={$t('recipeForm.prepTime')} />
				<Input
					type="text"
					id="cook_time"
					name="cook_time"
					placeholder={$t('recipeForm.cookTimePlaceholder')}
					bind:value={recipe.cook_time}
					label={$t('recipeForm.cookTime')} />
				<Input
					type="text"
					id="total_time"
					name="total_time"
					placeholder={$t('recipeForm.totalTimePlaceholder')}
					bind:value={recipe.total_time}
					label={$t('recipeForm.totalTime')} />
				<Input
					type="text"
					id="servings"
					placeholder={$t('recipeForm.servingsPlaceholder')}
					name="servings"
					bind:value={recipe.servings}
					label={$t('recipeForm.servings')} />
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
		{#if aiEnabled}
			<div class="mt-2">
				<Button
					type="button"
					size="sm"
					style="soft"
					onclick={() => (imagePromptDialogOpen = true)}
					disabled={generatingRecipeImage || !canGenerateImage}>
					{#if generatingRecipeImage}
						<Spinner visible={true} size="xs" type="dots" />
						{$t('recipeForm.generatingImage')}
					{:else}
						<Bolt width="16px" height="16px" />
						{$t('recipeForm.generateImage')}
					{/if}
				</Button>
				{#if !editMode}
					<InfoText class="mt-1">{$t('recipeForm.generateImageSaveFirst')}</InfoText>
				{:else if !canGenerateImage}
					<InfoText class="mt-1">{$t('recipeForm.generateImageNeedContent')}</InfoText>
				{/if}
			</div>
		{/if}
		<!-- Full-width large text fields -->
		<div>
			<Textarea
				id="ingredients"
				name="ingredients"
				rows="7"
				placeholder={$t('recipeForm.ingredientsPlaceholder')}
				bind:value={recipe.ingredients}
				label={$t('recipeForm.ingredients')} />
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
							{$t('recipeForm.restoreOriginal')}
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
								{$t('recipeForm.cleaning')}
							{:else}
								<Bolt width="16px" height="16px" />
								{$t('recipeForm.cleanIngredients')}
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
								{$t('common.undo')}
							</Button>
						{/if}
					{/if}
				</div>
				{#if recipe.ingredients_original}
					<InfoText class="mt-1">{$t('recipeForm.restoreIngredientsTip')}</InfoText>
				{:else}
					<InfoText class="mt-1">{$t('recipeForm.cleanIngredientsTip')}</InfoText>
				{/if}
			{/if}
		</div>
		<Textarea
			id="description"
			name="description"
			rows="3"
			placeholder={$t('recipeForm.descriptionPlaceholder')}
			bind:value={recipe.description}
			label={$t('recipeForm.description')} />
		<div>
			<Textarea
				id="directions"
				placeholder={$t('recipeForm.directionsPlaceholder')}
				rows="7"
				name="directions"
				bind:value={recipe.directions}
				label={$t('recipeForm.directions')} />
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
							{$t('recipeForm.restoreOriginal')}
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
								{$t('recipeForm.summarizing')}
							{:else}
								<Bolt width="16px" height="16px" />
								{$t('recipeForm.summarizeDirections')}
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
								{$t('common.undo')}
							</Button>
						{/if}
					{/if}
				</div>
				{#if recipe.directions_original}
					<InfoText class="mt-1">{$t('recipeForm.restoreDirectionsTip')}</InfoText>
				{:else}
					<InfoText class="mt-1">{$t('recipeForm.summarizeDirectionsTip')}</InfoText>
				{/if}
			{/if}
		</div>
		<Textarea
			id="notes"
			name="notes"
			rows="3"
			placeholder={$t('recipeForm.notesPlaceholder')}
			bind:value={recipe.notes}
			label={$t('recipeForm.notes')} />
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
						{$t('recipeForm.addingTips')}
					{:else}
						<Bolt width="16px" height="16px" />
						{$t('recipeForm.addTips')}
					{/if}
				</Button>
				{#if notesBeforeTips !== null}
					<Button type="button" size="sm" style="outline" color="secondary" onclick={undoAddTips}>
						<Undo width="16px" height="16px" />
						{$t('common.undo')}
					</Button>
				{/if}
			</div>
			<InfoText class="mt-1">{$t('recipeForm.addTipsTip')}</InfoText>
		{/if}
		<Textarea
			id="nutritional_info"
			name="nutritional_info"
			rows="3"
			bind:value={recipe.nutritional_info}
			label={$t('recipeForm.nutritionalInfo')} />
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
						{$t('recipeForm.cleaning')}
					{:else}
						<Bolt width="16px" height="16px" />
						{$t('recipeForm.cleanNutrition')}
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
						{$t('common.undo')}
					</Button>
				{/if}
			</div>
			<InfoText class="mt-1">{$t('recipeForm.cleanNutritionTip')}</InfoText>
		{/if}
		<Button type="submit" size="sm" class="mt-4">{resolvedButtonText}</Button>
		{#if recipeCategories}
			{#each recipeCategories as categoryUid}
				<input type="hidden" name="categories[]" value={categoryUid} />
			{/each}
		{/if}
	</div>
</form>

<Dialog bind:isOpen={imagePromptDialogOpen} onClose={() => (imagePromptDialogOpen = false)}>
	<h3 class="font-bold text-lg mb-4">{$t('recipeForm.generateImage')}</h3>
	<div class="flex flex-col gap-3">
		<Textarea
			label={$t('recipeForm.styleOverride')}
			rows={3}
			placeholder={DEFAULT_IMAGE_STYLE_DESCRIPTION}
			bind:value={imagePromptOverride}
			disabled={generatingRecipeImage} />
		<InfoText>
			{$t('recipeForm.styleOverrideHint')}
		</InfoText>
	</div>
	<div class="modal-action">
		<Button
			type="button"
			style="outline"
			color="secondary"
			onclick={() => (imagePromptDialogOpen = false)}
			disabled={generatingRecipeImage}>
			{$t('common.cancel')}
		</Button>
		<Button
			type="button"
			onclick={handleGenerateRecipeImage}
			disabled={generatingRecipeImage || !canGenerateImage}>
			{#if generatingRecipeImage}
				<Spinner visible={true} size="xs" type="dots" />
				{$t('recipeForm.generating')}
			{:else}
				{$t('recipeForm.generate')}
			{/if}
		</Button>
	</div>
</Dialog>

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
