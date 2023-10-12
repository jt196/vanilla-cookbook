<script>
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import { uploadPaprikaFile } from '$lib/utils/crud.js'
	export let data
	let paprikarecipesFiles = data.paprikarecipesFiles

	let recUploadMessage = ''
	let recImportMessage = ''

	let isPublic = false
	$: console.log('🚀 ~ file: +page.svelte:13 ~ isPublic:', isPublic)

	let selectedFiles = []

	async function removeFile(filename) {
		if (!confirm('Are you sure you want to remove this file?')) {
			return
		}
		const response = await fetch('/api/import/paprika/file', {
			method: 'DELETE',
			body: JSON.stringify({ filename: filename }) // or whatever filename you want to delete
		})
		const result = await response.json()
		if (result.success) {
			fetchPaprikaFiles()
			recUploadMessage = filename + ' successfully deleted from uploads folder!'
		}
	}

	function handlePaprikaUpload(event) {
		const file = event.target.files[0]
		if (file && file.name.endsWith('.paprikarecipes')) {
			selectedFiles = [file]
		} else {
			console.error('Invalid file type')
		}
	}

	async function handleSubmit(event) {
		event.preventDefault()

		const formData = new FormData()

		// Append the selected file
		if (selectedFiles && selectedFiles.length) {
			formData.append('paprikaFile', selectedFiles[0])
		}

		const result = await uploadPaprikaFile(formData)
		console.log('Uploading File!')
		if (result.success) {
			console.log('File uploaded successfully!')
			fetchPaprikaFiles()
			recUploadMessage = result.message // Shows success message
		} else {
			console.log('There was a problem uploading your file!')
			recUploadMessage = result.message // Shows error message
		}
	}

	async function importFromPaprikaFile(filename) {
		console.log('🚀 ~ file: +page.svelte:61 ~ importFromPaprikaFile ~ filename:', filename)
		console.log('Importing Paprika file!')
		try {
			const response = await fetch('/api/import/paprika/paprikarecipes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
					// If your API needs authentication, you might also include authorization headers here
				},
				body: JSON.stringify({ filename: filename, isPublic: isPublic })
			})

			const data = await response.json()
			console.log('🚀 ~ file: +page.svelte:232 ~ importFromPaprikaFile ~ data:', data)

			if (response.status === 200) {
				recImportMessage = data.success
				console.log(
					'🚀 ~ file: +page.svelte:77 ~ importFromPaprikaFile ~ recImportMessage:',
					recImportMessage
				)
				console.log(`Imported ${data.count} recipes!`) // Or you can utilize this data however you see fit
			} else {
				recImportMessage = data.error || 'An unknown error occurred.'
			}
		} catch (error) {
			console.error('Error importing recipes:', error)
			recImportMessage = 'Failed to import recipes. Please try again.'
		}
	}

	async function fetchPaprikaFiles() {
		try {
			const response = await fetch('/api/import/paprika/paprikarecipes')
			const data = await response.json()
			if (response.status === 200) {
				paprikarecipesFiles = data.files // Update the files list on the frontend
			}
		} catch (error) {
			console.error('Error fetching files:', error)
		}
	}
</script>

<div class="paprika-file-upload">
	<h3>Upload a Paprika File</h3>
	<label for="file">Click browse to upload a .paprikarecipes file</label>
	<input type="file" id="file" name="file" on:change={handlePaprikaUpload} />
	{#if selectedFiles.length > 0}
		<button class="outline secondary" disabled={selectedFiles.length == 0} on:click={handleSubmit}
			>Upload .paprikarecipes File</button>
	{/if}
	<div class="feedback">
		<FeedbackMessage message={recUploadMessage} />
	</div>
</div>
{#if paprikarecipesFiles && paprikarecipesFiles.length !== 0}
	<div class="paprika-file-import">
		<h3>Import an uploaded Paprika file</h3>
		{#each paprikarecipesFiles as file}
			<button
				class="outline secondary"
				disabled={!paprikarecipesFiles || paprikarecipesFiles.length === 0}
				on:click={() => importFromPaprikaFile(file)}>Import {file}</button>
			<button class="outline secondary" on:click={() => removeFile(file)}
				><Delete width="30px" height="30px" fill="var(--pico-del-color)" /></button>
		{/each}
		<label>
			<input
				type="checkbox"
				data-tooltip="Make your imported recipes public"
				name="Recipes Public"
				bind:checked={isPublic} />
			Recipes Public
		</label>
	</div>
{/if}
<div class="feedback">
	<FeedbackMessage message={recImportMessage} />
</div>

<style lang="scss">
	.feedback {
		margin: 1rem 0 1rem 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.paprika-file-import {
		margin-bottom: 2rem;
	}

	.outline.secondary {
		margin-left: 0;
	}
</style>
