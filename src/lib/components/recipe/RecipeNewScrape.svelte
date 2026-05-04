<script>
	import { handleParse, handleScrape, handleImage, handleHTMLFile } from '$lib/utils/parse/parseHelpersClient'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import { defaultRecipe } from '$lib/utils/config'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Textarea from '$lib/components/ui/Form/Textarea.svelte'
	import FileInput from '$lib/components/ui/Form/FileInput.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Toggle from '$lib/components/ui/Form/Toggle.svelte'
	import Spinner from '$lib/components/ui/Spinner.svelte'
	import { get } from 'svelte/store'
	import { t } from '$lib/stores/locale.js'

	let {
		url = $bindable(''),
		sharedText = $bindable(null),
		recipe = $bindable(),
		apiKeyPresent = false,
		aiEnabled = false,
		imageAllowed = true,
		initialMode = 'url',
		userUnits = 'metric',
		userLanguage = 'eng'
	} = $props()

	let feedbackMessage = $state('')
	let feedbackCode = $state(null)
	let feedbackType = $state('info')
	let loading = $state(false)
	let maxImages = 3
	let textParsingAvailable = $derived(aiEnabled && apiKeyPresent)

	// Tab state
	let selectedMode = $state(initialMode)
	let isPromptMode = $state(false)
	let selectedFiles = $state([])
	let lastAppliedInitialMode = $state(initialMode)

	// Derive textMode from isPromptMode for cleaner reactivity
	let textMode = $derived(isPromptMode ? 'prompt' : 'parse')

	// Derive disabled states for submit buttons
	let isUrlEmpty = $derived(!url || url.trim() === '')
	let isTextEmpty = $derived(!sharedText || sharedText.trim() === '')
	let isFileEmpty = $derived(!selectedFiles || selectedFiles.length === 0)

	// Detect whether selected files are HTML or images
	let detectedFileMode = $derived(
		selectedFiles?.length > 0 &&
			selectedFiles.some((f) => f.name.endsWith('.html') || f.type === 'text/html')
			? 'html'
			: 'image'
	)

	$effect(() => {
		if (initialMode && initialMode !== lastAppliedInitialMode) {
			selectedMode = initialMode
			lastAppliedInitialMode = initialMode
		}
	})

	async function scrapeEventHandler(event) {
		event.preventDefault()
		recipe = { ...defaultRecipe }
		loading = true
		const tFn = get(t)

		try {
			if (selectedMode === 'url') {
				feedbackMessage = tFn('recipeNew.msg.scraping')
				feedbackCode = null
				feedbackType = 'info'
				const scrapedData = await handleScrape(event, url)
				recipe = { ...recipe, ...scrapedData }

				if (scrapedData._status === 'complete') {
					feedbackCode = null
					feedbackMessage =
						scrapedData._source === 'AI'
							? tFn('recipeNew.msg.aiSuccess')
							: tFn('recipeNew.msg.manualSuccess')
					feedbackType = 'success'
				} else {
					feedbackCode = null
					feedbackMessage =
						scrapedData._source === 'AI'
							? tFn('recipeNew.msg.aiPartial')
							: tFn('recipeNew.msg.manualPartial')
					feedbackType = 'warning'
				}
			} else if (selectedMode === 'text') {
				if (!textParsingAvailable) {
					feedbackMessage = tFn('recipeNew.msg.capturedTextNoAi')
					feedbackCode = null
					feedbackType = 'warning'
					return
				}

				feedbackCode = null
				feedbackMessage =
					textMode === 'prompt' ? tFn('recipeNew.msg.generating') : tFn('recipeNew.msg.parsing')
				const parsedData = await handleParse(event, sharedText, {
					mode: textMode,
					unitsPreference: userUnits,
					language: userLanguage
				})
				recipe = { ...recipe, ...parsedData }
				feedbackCode = null
				feedbackMessage =
					textMode === 'prompt'
						? tFn('recipeNew.msg.generateSuccess')
						: tFn('recipeNew.msg.parseSuccess')
				feedbackType = 'success'
			} else if (selectedMode === 'file') {
				if (!selectedFiles?.length) {
					feedbackMessage = tFn('recipeNew.msg.noFile')
					feedbackCode = null
					feedbackType = 'error'
					return
				}

				if (detectedFileMode === 'html') {
					feedbackMessage = tFn('recipeNew.msg.parsingHtml')
					feedbackCode = null
					feedbackType = 'info'
					const parsedData = await handleHTMLFile(event, selectedFiles[0])
					recipe = { ...recipe, ...parsedData }
					feedbackCode = null
					feedbackMessage =
						parsedData._status === 'complete'
							? tFn('recipeNew.msg.htmlSuccess')
							: tFn('recipeNew.msg.htmlPartial')
					feedbackType = parsedData._status === 'complete' ? 'success' : 'warning'
				} else {
					feedbackMessage = tFn('recipeNew.msg.analyzingImage')
					feedbackCode = null
					const parsedData = await handleImage(event, selectedFiles, userLanguage)
					recipe = { ...recipe, ...parsedData }

					if (parsedData._status === 'complete') {
						feedbackCode = null
						feedbackMessage =
							parsedData._source === 'AI'
								? tFn('recipeNew.msg.imageAiSuccess')
								: tFn('recipeNew.msg.imageManualSuccess')
						feedbackType = 'success'
					} else {
						feedbackCode = null
						feedbackMessage =
							parsedData._source === 'AI'
								? tFn('recipeNew.msg.imageAiPartial')
								: tFn('recipeNew.msg.imageManualPartial')
						feedbackType = 'warning'
					}
				}
			}
		} catch (err) {
			console.error(err)
			feedbackMessage = err?.message || (typeof err === 'string' ? err : '')
			feedbackCode = err?.code || (feedbackMessage ? null : 'recipeNew.msg.somethingWrong')
			feedbackType = 'error'
		} finally {
			loading = false
		}
	}
</script>

<!-- Form Inputs -->
<form onsubmit={scrapeEventHandler} class="flex flex-col gap-4 max-w-none w-full">
	<div class="tabs tabs-box p-0">
		<input
			type="radio"
			name="scrape_tabs"
			class="tab"
			aria-label={$t('common.url')}
			value="url"
			bind:group={selectedMode}
			checked={selectedMode === 'url'}
		/>
		<div class="tab-content bg-base-100 border-base-300 p-2 ml-0 mr-0">
			<Input type="text" placeholder={$t('recipeNew.urlPlaceholder')} bind:value={url} />
			<Button type="submit" class="w-auto self-start mt-2" disabled={isUrlEmpty}
				>{$t('recipeNew.scrapeUrl')}</Button
			>
		</div>

		{#if textParsingAvailable || sharedText}
			<input
				type="radio"
				name="scrape_tabs"
				class="tab"
				aria-label={$t('recipeNew.tabText')}
				value="text"
				bind:group={selectedMode}
				checked={selectedMode === 'text'}
			/>
			<div class="tab-content bg-base-100 border-base-300 p-2 ml-0 mr-0">
				{#if textParsingAvailable}
					<div class="flex items-center gap-2 mb-2">
						<span class="text-sm">{$t('recipeNew.tabText')}</span>
						<Toggle bind:checked={isPromptMode} size="sm" />
						<span class="text-sm">{$t('recipeNew.tabPrompt')}</span>
					</div>
				{/if}
				<Textarea
					rows={8}
					placeholder={textMode === 'prompt'
						? $t('recipeNew.promptPlaceholder')
						: $t('recipeNew.textPlaceholder')}
					bind:value={sharedText}
				/>
				<Button
					type="submit"
					class="w-auto self-start  mt-2"
					disabled={isTextEmpty || !textParsingAvailable}
				>
					{textParsingAvailable
						? textMode === 'prompt'
							? $t('recipeNew.generateRecipe')
							: $t('recipeNew.parseText')
						: $t('recipeNew.aiNotEnabled')}
				</Button>
			</div>

			{/if}

		<input
			type="radio"
			name="scrape_tabs"
			class="tab"
			aria-label={$t('recipeNew.tabFile')}
			value="file"
			bind:group={selectedMode}
			checked={selectedMode === 'file'}
		/>
		<div class="tab-content bg-base-100 border-base-300 p-2 ml-0 mr-0">
			<FileInput
				accept="image/*,.html"
				multiple={true}
				on:change={(e) => {
					const files = Array.from(e.detail.target.files)
					const hasHtml = files.some((f) => f.name.endsWith('.html') || f.type === 'text/html')
					if (hasHtml) {
						selectedFiles = files
							.filter((f) => f.name.endsWith('.html') || f.type === 'text/html')
							.slice(0, 1)
					} else {
						selectedFiles = files.slice(0, maxImages)
						if (files.length > maxImages) {
							feedbackCode = null
							feedbackMessage = get(t)('recipeNew.msg.imageLimitExceeded', { max: maxImages })
							feedbackType = 'warning'
						} else {
							feedbackMessage = ''
							feedbackCode = null
						}
					}
				}}
				optionalLabel={$t('recipeNew.fileLimit', { max: maxImages })}
			/>
			<Button
				type="submit"
				class="w-auto self-start mt-2"
				disabled={isFileEmpty || (detectedFileMode === 'image' && !textParsingAvailable)}
			>
				{#if detectedFileMode === 'html' && !isFileEmpty}
					{$t('recipeNew.parseHtml')}
				{:else if textParsingAvailable}
					{selectedFiles?.length > 1 ? $t('recipeNew.analyzeImages') : $t('recipeNew.analyzeImage')}
				{:else}
					{$t('recipeNew.aiNotEnabled')}
				{/if}
			</Button>
			{#if detectedFileMode === 'image' && !isFileEmpty && !textParsingAvailable}
				<p class="text-sm text-warning mt-1">{$t('recipeNew.msg.aiNotEnabled')}</p>
			{/if}
		</div>
	</div>
</form>

<Spinner visible={loading} spinnerContent={$t('common.working')} type="bars" size="md" />

{#if feedbackMessage}
	<FeedbackMessage
		message={feedbackMessage}
		messageCode={feedbackCode}
		type={feedbackType}
		inline
		timeout={4000}
	/>
{/if}
