<script>
	import { handleParse, handleScrape, handleImage } from '$lib/utils/parse/parseHelpersClient'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import { defaultRecipe } from '$lib/utils/config'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Textarea from '$lib/components/ui/Form/Textarea.svelte'
	import FileInput from '$lib/components/ui/Form/FileInput.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Toggle from '$lib/components/ui/Form/Toggle.svelte'
	import Spinner from '$lib/components/Spinner.svelte'

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
	let feedbackType = $state('info')
	let loading = $state(false)
	let maxImages = 3

	// Tab state
	let selectedMode = $state(initialMode)
	let isPromptMode = $state(false)
	let imageFiles = $state([])

	// Derive textMode from isPromptMode for cleaner reactivity
	let textMode = $derived(isPromptMode ? 'prompt' : 'parse')

	// Derive disabled states for submit buttons
	let isUrlEmpty = $derived(!url || url.trim() === '')
	let isTextEmpty = $derived(!sharedText || sharedText.trim() === '')
	let isImageEmpty = $derived(!imageFiles || imageFiles.length === 0)

	$effect(() => {
		if (!imageAllowed && selectedMode === 'image') {
			selectedMode = 'url'
		}
	})

	async function scrapeEventHandler(event) {
		event.preventDefault()
		recipe = { ...defaultRecipe }
		loading = true

		try {
			if (selectedMode === 'url') {
				feedbackMessage = 'Scraping URL...'
				feedbackType = 'info'
				const scrapedData = await handleScrape(event, url)
				recipe = { ...recipe, ...scrapedData }

				if (scrapedData._status === 'complete') {
					feedbackMessage =
						scrapedData._source === 'AI' ? 'AI scrape success!' : 'Manual scrape success!'
					feedbackType = 'success'
				} else {
					feedbackMessage =
						scrapedData._source === 'AI' ? 'AI partially scraped.' : 'Manual partially scraped.'
					feedbackType = 'warning'
				}
			} else if (selectedMode === 'text') {
				feedbackMessage = textMode === 'prompt' ? 'Generating recipe...' : 'Parsing text...'
				const parsedData = await handleParse(event, sharedText, {
					mode: textMode,
					unitsPreference: userUnits,
					language: userLanguage
				})
				recipe = { ...recipe, ...parsedData }
				feedbackMessage =
					textMode === 'prompt' ? 'Recipe generated successfully.' : 'Text parsed successfully.'
				feedbackType = 'success'
			} else if (selectedMode === 'image') {
				if (!imageFiles?.length) {
					feedbackMessage = 'No image selected.'
					feedbackType = 'error'
					return
				}

				feedbackMessage = 'Analyzing image...'
				const parsedData = await handleImage(event, imageFiles, userLanguage)
				recipe = { ...recipe, ...parsedData }

				if (parsedData._status === 'complete') {
					feedbackMessage =
						parsedData._source === 'AI' ? 'AI image parse success!' : 'Manual image parse success!'
					feedbackType = 'success'
				} else {
					feedbackMessage =
						parsedData._source === 'AI'
							? 'AI partially parsed image.'
							: 'Manual partially parsed image.'
					feedbackType = 'warning'
				}
			}
		} catch (err) {
			console.error(err)
			feedbackMessage = 'Something went wrong.'
			feedbackType = 'error'
		} finally {
			loading = false
		}
	}
</script>

<!-- Form Inputs -->
<form onsubmit={scrapeEventHandler} class="flex flex-col gap-4 max-w-none w-full">
	<div class="tabs tabs-box">
		<input
			type="radio"
			name="scrape_tabs"
			class="tab"
			aria-label="URL"
			value="url"
			bind:group={selectedMode}
			checked={selectedMode === 'url'} />
		<div class="tab-content bg-base-100 border-base-300 p-2">
			<Input type="text" placeholder="Enter recipe URL" bind:value={url} />
			<Button type="submit" class="w-auto self-start mt-2" disabled={isUrlEmpty}>Scrape URL</Button>
		</div>

		{#if aiEnabled && apiKeyPresent}
			<input
				type="radio"
				name="scrape_tabs"
				class="tab"
				aria-label="Text"
				value="text"
				bind:group={selectedMode}
				checked={selectedMode === 'text'} />
			<div class="tab-content bg-base-100 border-base-300 p-2">
				<div class="flex items-center gap-2 mb-2">
					<span class="text-sm">Text</span>
					<Toggle bind:checked={isPromptMode} size="sm" />
					<span class="text-sm">Prompt</span>
				</div>
				<Textarea
					rows={8}
					placeholder={textMode === 'prompt'
						? 'Describe the recipe you want...'
						: 'Paste recipe text...'}
					bind:value={sharedText} />
				<Button type="submit" class="w-auto self-start  mt-2" disabled={isTextEmpty}>
					{textMode === 'prompt' ? 'Generate Recipe' : 'Parse Text'}
				</Button>
			</div>

			{#if imageAllowed}
				<input
					type="radio"
					name="scrape_tabs"
					class="tab"
					aria-label="Image"
					value="image"
					bind:group={selectedMode}
					checked={selectedMode === 'image'} />
				<div class="tab-content bg-base-100 border-base-300 p-2">
					<FileInput
						accept="image/*"
						multiple={true}
						on:change={(e) => {
							const files = Array.from(e.detail.target.files)
							imageFiles = files.slice(0, maxImages)
							if (files.length > maxImages) {
								feedbackMessage = `Only the first ${maxImages} images will be used.`
								feedbackType = 'warning'
							} else {
								feedbackMessage = ''
							}
						}}
						optionalLabel={`You can upload up to ${maxImages} images.`} />
					<Button type="submit" class="w-auto self-start mt-2" disabled={isImageEmpty}>
						Analyze Image{imageFiles?.length > 1 ? 's' : ''}
					</Button>
				</div>
			{/if}
		{/if}
	</div>
</form>

<Spinner visible={loading} spinnerContent="Working..." type="bars" size="md" />

{#if feedbackMessage}
	<FeedbackMessage message={feedbackMessage} type={feedbackType} inline timeout={4000} />
{/if}

<style lang="scss">
	.loading-overlay {
		position: absolute;
		top: 20vh;
		left: 50%;
		transform: translateX(-50%);
		width: auto;
		padding: 0.5rem 1rem;

		background: var(--pico-background-color);
		border: 1px solid var(--pico-muted-border-color);
		border-radius: 4px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
		opacity: 1;
		transition: opacity 0.2s ease;

		&[hidden] {
			opacity: 0;
		}
	}
</style>
