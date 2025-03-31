<script>
	import { handleParse, handleScrape, handleImage } from '$lib/utils/parse/parseHelpersClient'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import { defaultRecipe } from '$lib/utils/config'
	import Chain from '$lib/components/svg/Chain.svelte'
	import Note from '$lib/components/svg/Note.svelte'
	import Image from '$lib/components/svg/Image.svelte'

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
		recipe = defaultRecipe
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

<!-- Tab Navigation -->
{#if aiEnabled && apiKeyPresent}
	<div class="tab-toggle" role="group">
		{#each ['url', 'text', 'image'] as mode}
			<button
				class:selected={selectedMode === mode}
				class:secondary={selectedMode === mode}
				disabled={selectedMode === mode}
				onclick={() => {
					selectedMode = mode
					recipe = defaultRecipe
					sharedText = null
					imageFile = null
					url = ''
				}}>
				{#if mode === 'url'}
					<Chain width="18px" style="margin-right: 0.3em;" /> Scrape URL
				{:else if mode === 'text'}
					<Note width="18px" style="margin-right: 0.3em;" /> Paste Text
				{:else if mode === 'image'}
					<Image width="18px" style="margin-right: 0.3em;" /> Upload Image
				{/if}
			</button>
		{/each}
	</div>
{/if}

<!-- Form Inputs -->
<form onsubmit={scrapeEventHandler}>
	{#if selectedMode === 'url'}
		<input type="text" placeholder="Enter recipe URL" bind:value={url} />
	{:else if selectedMode === 'text'}
		<textarea rows="8" placeholder="Paste recipe text..." bind:value={sharedText}></textarea>
	{:else if selectedMode === 'image'}
		<input type="file" accept="image/*" onchange={(e) => (imageFile = e.target.files[0])} />
	{/if}
	<button type="submit">
		{selectedMode === 'url' ? 'Scrape' : selectedMode === 'text' ? 'Parse Text' : 'Analyze Image'}
	</button>
</form>

<div class="loading-overlay" aria-busy={loading} hidden={!loading}></div>
<!-- Styling/Debugging Always on div for the loading spinner -->
<!-- <div class="loading-overlay" aria-busy="true"></div> -->

{#if feedbackMessage}
	<FeedbackMessage message={feedbackMessage} type={feedbackType} timeout={4000} />
{/if}

<style lang="scss">
	.tab-toggle {
		margin-bottom: 1rem;
		button {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.3em; // space between icon and text

			width: 140px;
			height: 40px; // or whatever looks right
			padding: 0.5em 1em;
		}
	}
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
