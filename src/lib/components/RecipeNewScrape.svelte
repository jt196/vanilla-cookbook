<script>
	import { handleParse, handleScrape, handleImage } from '$lib/utils/parse/parseHelpersClient'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import { defaultRecipe } from '$lib/utils/config'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Textarea from '$lib/components/ui/Form/Textarea.svelte'
	import FileInput from '$lib/components/ui/Form/FileInput.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Spinner from '$lib/components/Spinner.svelte'

	let {
		url = $bindable(''),
		sharedText = $bindable(null),
		recipe = $bindable(),
		apiKeyPresent = false,
		aiEnabled = false,
		initialMode = 'url'
	} = $props()

	let feedbackMessage = $state('')
	let feedbackType = $state('info')
	let loading = $state(false)

	// Tab state
	let selectedMode = $state(initialMode)

	let imageFile = $state(null)

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
				feedbackMessage = 'Parsing text...'
				const parsedData = await handleParse(event, sharedText)
				recipe = { ...recipe, ...parsedData }
				feedbackMessage = 'Text parsed successfully.'
				feedbackType = 'success'
			} else if (selectedMode === 'image') {
				if (!imageFile) {
					feedbackMessage = 'No image selected.'
					feedbackType = 'error'
					return
				}

				feedbackMessage = 'Analyzing image...'
				const parsedData = await handleImage(event, imageFile)
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
		<input type="radio" name="my_tabs_6" class="tab" aria-label="Scrape URL" />
		<div class="tab-content bg-base-100 border-base-300 p-2">
			<Input type="text" placeholder="Enter recipe URL" bind:value={url} />
			<Button type="submit" class="w-auto self-start mt-2">Scrape</Button>
		</div>

		{#if aiEnabled && apiKeyPresent}
			<input type="radio" name="my_tabs_6" class="tab" aria-label="Paste Text" checked="checked" />
			<div class="tab-content bg-base-100 border-base-300 p-2">
				<Textarea rows={8} placeholder="Paste recipe text..." bind:value={sharedText} />
				<Button type="submit" class="w-auto self-start  mt-2">Parse Text</Button>
			</div>

			<input type="radio" name="my_tabs_6" class="tab" aria-label="Upload Image" />
			<div class="tab-content bg-base-100 border-base-300 p-2">
				<FileInput accept="image/*" onchange={(e) => (imageFile = e.target.files[0])} />
				<Button type="submit" class="w-auto self-start mt-2">Analyze Image</Button>
			</div>
		{/if}
	</div>
</form>

<Spinner visible={loading} spinnerContent="Working..." type="bars" size="md" />

{#if feedbackMessage}
	<FeedbackMessage message={feedbackMessage} type={feedbackType} timeout={4000} />
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
