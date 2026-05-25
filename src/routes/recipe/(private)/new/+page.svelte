<script>
	import { onMount } from 'svelte'
	import { goto, afterNavigate } from '$app/navigation'
	import { createRecipe } from '$lib/utils/crud'
	import {
		handleParse,
		handleScrape,
		isBlockedScrapeErrorMessage
	} from '$lib/utils/parse/parseHelpersClient'
	import RecipeForm from '$lib/components/recipe/RecipeForm.svelte'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import { defaultRecipe } from '$lib/utils/config'
	import RecipeNewScrape from '$lib/components/recipe/RecipeNewScrape.svelte'
	import Spinner from '$lib/components/ui/Spinner.svelte'
	import { readBookmarkletPayload } from '$lib/utils/bookmarklet'
	import { get } from 'svelte/store'
	import { t } from '$lib/stores/locale.js'

	/**
	 * The scraped recipe object.
	 * @property {string} name - Name of the recipe.
	 * @property {string} source - Source of the recipe.
	 * @property {string} source_url - URL source of the recipe.
	 * @property {string} cook_time - Cook time of the recipe.
	 * @property {string} image_url - Image URL of the recipe.
	 * @property {string} prep_time - Preparation time of the recipe.
	 * @property {string} ingredients - Ingredients of the recipe.
	 * @property {string} directions - Directions of the recipe.
	 * @property {string} total_time - Total time of the recipe.
	 * @property {string} servings - Servings of the recipe.
	 * @property {string} nutritional_info - Nutritional information of the recipe.
	 */

	let url = $state(null)
	let sharedText = $state(null)
	let feedbackMessage = $state('')
	let feedbackCode = $state(null)
	let feedbackType = $state('info')
	let selectedFiles = $state([])
	let saveImageUrl = $state(true)

	let initialMode = $state('url') // 'url' | 'text' | 'image'
	let saving = $state(false)

	let { data } = $props()

	let {
		apiKeyPresent,
		aiEnabled,
		aiProvider,
		aiSelectedProvider,
		aiSelectedProviderConfigured,
		isAdmin,
		imageAllowed,
		userPublicRecipes,
		userUnits,
		userLanguage
	} = $state(data)

	let recipe = $state({ ...defaultRecipe, is_public: !!userPublicRecipes })

	/**
	 * Handles the scraping event.
	 * @param {Event} event - The scrape event.
	 * @returns {Promise<void>}
	 */

	// Tracks the last share URL/text we processed so afterNavigate doesn't re-run onMount's work.
	let lastProcessedShare = $state('')

	async function processIncomingShare(rawUrl, text) {
		const tFn = get(t)

		if (!rawUrl && text && /^https?:\/\//.test(text)) {
			rawUrl = text
		}

		const shareKey = rawUrl || text || ''
		if (!shareKey || shareKey === lastProcessedShare) return
		lastProcessedShare = shareKey

		url = rawUrl ? decodeURIComponent(rawUrl) : null
		sharedText = !rawUrl ? text : null
		recipe = { ...defaultRecipe, is_public: !!userPublicRecipes }

		if (url) {
			initialMode = 'url'
			console.log('[recipe:new] Starting scrape for:', url)
			try {
				feedbackMessage = tFn('recipeNew.msg.scraping')
				feedbackType = 'info'
				const scrapedData = await handleScrape(null, url)
				console.log('[recipe:new] Scrape completed, status:', scrapedData?._status)
				if (scrapedData) {
					recipe = { ...recipe, ...scrapedData }
					if (scrapedData._status === 'complete') {
						feedbackMessage = tFn('recipeNew.msg.scrapeSuccess')
						feedbackType = 'success'
					} else {
						feedbackMessage = tFn('recipeNew.msg.scrapePartial')
						feedbackType = 'warning'
					}
				}
			} catch (error) {
				console.error('[recipe:new] Scrape failed:', error)
				const message =
					error?.message || (typeof error === 'string' ? error : tFn('recipeNew.msg.scrapeError'))
				if (isBlockedScrapeErrorMessage(message) && sharedText) {
					initialMode = 'text'
					if (apiKeyPresent && aiEnabled) {
						try {
							feedbackMessage = tFn('recipeNew.msg.scrapeBlocked')
							feedbackType = 'info'
							const parsedData = await handleParse(null, sharedText, {
								mode: 'parse',
								unitsPreference: userUnits,
								language: userLanguage
							})
							recipe = { ...recipe, ...parsedData }
							feedbackMessage =
								parsedData._status === 'complete'
									? tFn('recipeNew.msg.scrapeBlockedSuccess')
									: tFn('recipeNew.msg.scrapeBlockedPartial')
							feedbackType = parsedData._status === 'complete' ? 'success' : 'warning'
						} catch (parseError) {
							console.error('[recipe:new] Bookmarklet text parse failed:', parseError)
							feedbackMessage = tFn('recipeNew.msg.scrapeBlockedText')
							feedbackType = 'warning'
						}
					} else {
						feedbackMessage = tFn('recipeNew.msg.scrapeBlockedText')
						feedbackType = 'warning'
					}
				} else {
					feedbackMessage = message
					feedbackType = 'error'
				}
			}
		} else if (sharedText && apiKeyPresent && aiEnabled) {
			initialMode = 'text'
		} else if (sharedText && (!apiKeyPresent || !aiEnabled)) {
			initialMode = 'text'
			feedbackMessage = tFn('recipeNew.msg.aiNotEnabled')
		}
	}

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search)
		const bookmarkletPayload = readBookmarkletPayload(window)
		let rawUrl = urlParams.get('url') || bookmarkletPayload?.url || null
		let text = urlParams.get('text') || bookmarkletPayload?.text || null
		await processIncomingShare(rawUrl, text)
	})

	// Handles the case where the app is already open when a share arrives.
	// onMount won't re-fire on same-route navigation; afterNavigate catches it.
	afterNavigate(async ({ to }) => {
		if (!to?.url) return
		const rawUrl = to.url.searchParams.get('url')
		const text = to.url.searchParams.get('text')
		if (!rawUrl && !text) return
		await processIncomingShare(rawUrl, text)
	})

	async function handleCreateRecipe(event) {
		event.preventDefault()
		saving = true
		console.log('[recipe:new] Starting save, recipe name:', recipe?.name)
		const tFn = get(t)

		const formData = new FormData()
		formData.append('recipe', JSON.stringify({ ...recipe, saveImageUrl }))

		for (const file of selectedFiles) {
			formData.append('images', file)
		}

		try {
			console.log('[recipe:new] Calling createRecipe API')
			const result = await createRecipe(formData)
			console.log('[recipe:new] createRecipe returned, success:', result.success)
			if (result.success) {
				await goto(`/recipe/${result.data.uid}/view/`)
			} else {
				console.error('[recipe:new] Save failed:', result.error)
				feedbackMessage = result.error || ''
				feedbackCode = result.code || 'recipeNew.msg.saveFail'
				feedbackType = 'error'
			}
		} catch (error) {
			console.error('[recipe:new] Unexpected create error:', error)
			feedbackMessage = ''
			feedbackCode = 'recipeNew.msg.saveFail'
			feedbackType = 'error'
		} finally {
			saving = false
		}
	}

	function handleSelectedFilesChange(files) {
		selectedFiles = files
	}
</script>

<RecipeNewScrape
	bind:url
	bind:sharedText
	bind:recipe
	{apiKeyPresent}
	{aiEnabled}
	{initialMode}
	{imageAllowed}
	{userUnits}
	{userLanguage}
/>

<RecipeForm
	bind:recipe
	onSubmit={handleCreateRecipe}
	cancelHref="/"
	{aiEnabled}
	{aiProvider}
	{aiSelectedProvider}
	{aiSelectedProviderConfigured}
	{isAdmin}
	{userUnits}
	{userLanguage}
	{selectedFiles}
	bind:saveImageUrl
	onSelectedFilesChange={handleSelectedFilesChange}
/>

{#if feedbackMessage}
	<FeedbackMessage
		message={feedbackMessage}
		messageCode={feedbackCode}
		type={feedbackType}
		timeout={4000}
	/>
{/if}

<Spinner visible={saving} spinnerContent={$t('recipeNew.saving')} />
