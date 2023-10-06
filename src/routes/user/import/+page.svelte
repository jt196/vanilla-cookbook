<script>
	import TrueFalse from '$lib/components/TrueFalse.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import { importFileExists } from '$lib/utils/crud.js'
	import { onMount } from 'svelte'
	export let data
	const { user, importCount } = data
	const { catDb, catFile, recDb, recFile } = importCount

	let paprikaUser = ''
	let paprikaPassword = ''

	let catFeedbackMessage = ''
	let recFeedbackMessage = ''
	let catFileExists = false
	let recFileExists = false

	onMount(async () => {
		await checkCategoryFileExists(user.userId)
		await checkRecipeFileExists(user.userId)
	})

	async function downloadCategories() {
		// 1. Update the feedbackMessage to notify the user that the process has started
		catFeedbackMessage = 'Importing categories, please wait!'
		console.log(
			'🚀 ~ file: +page.svelte:26 ~ downloadCategories ~ catFeedbackMessage:',
			catFeedbackMessage
		)

		try {
			const response = await fetch('/api/import/paprika/categories', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ paprikaUser, paprikaPassword })
			})

			const result = await response.json()

			// 2. Update the catFeedbackMessage based on the server's response
			if (response.ok) {
				await checkCategoryFileExists(user.userId)
				catFeedbackMessage = 'Categories imported successfully!'
				console.log(
					'🚀 ~ file: +page.svelte:43 ~ downloadCategories ~ catFeedbackMessage:',
					catFeedbackMessage
				)
			} else {
				catFeedbackMessage = result.error
				console.log(
					'🚀 ~ file: +page.svelte:46 ~ downloadCategories ~ catFeedbackMessage:',
					catFeedbackMessage
				)
			}
		} catch (error) {
			// Handle any unexpected errors during the fetch
			catFeedbackMessage = 'An unexpected error occurred. Please try again later.'
			console.log(
				'🚀 ~ file: +page.svelte:51 ~ downloadCategories ~ catFeedbackMessage:',
				catFeedbackMessage
			)
			console.error('Error downloading categories:', error)
		}
	}

	async function downloadRecipes() {
		// 1. Update the feedbackMessage to notify the user that the process has started
		recFeedbackMessage = 'Importing recipes, please wait!'

		try {
			const response = await fetch('/api/import/paprika/recipes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ paprikaUser, paprikaPassword })
			})

			const result = await response.json()

			// 2. Update the recFeedbackMessage based on the server's response
			if (response.ok) {
				await checkRecipeFileExists(user.userId)
				recFeedbackMessage = 'Recipes imported successfully!'
			} else {
				recFeedbackMessage = result.error
			}
		} catch (error) {
			// Handle any unexpected errors during the fetch
			recFeedbackMessage = 'An unexpected error occurred. Please try again later.'
			console.error('Error downloading recipes:', error)
		}
	}

	// Example Usage:
	async function checkCategoryFileExists() {
		const filename = 'categories.json'
		const exists = await importFileExists(filename)
		console.log('🚀 ~ file: +page.svelte:39 ~ checkCategoryFileExists ~ exists:', exists)
		if (exists) {
			catFileExists = exists
		} else {
			catFileExists = false
		}
	}

	async function checkRecipeFileExists() {
		const filename = 'recipes.json'
		const exists = await importFileExists(filename)
		console.log('🚀 ~ file: +page.svelte:70 ~ checkRecipeFileExists ~ exists:', exists)
		if (exists) {
			recFileExists = exists
		} else {
			recFileExists = false
		}
	}

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
			await checkCategoryFileExists()
		}
	}

	let catImportStatus = null
	let recImportStatus = null

	// TODO: Test this!
	async function importCategoriesFromFile() {
		try {
			const response = await fetch('/api/import/paprika/categories', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
					// If your API needs authentication, you might also include authorization headers here
				}
			})

			const data = await response.json()

			if (data.success) {
				catImportStatus = 'Categories successfully imported!'
			} else {
				catImportStatus = data.error || 'An unknown error occurred.'
			}
		} catch (error) {
			console.error('Error importing categories:', error)
			catImportStatus = 'Failed to import categories. Please try again.'
		}
	}

	async function importRecipesFromFile() {
		try {
			const response = await fetch('/api/import/paprika/recipes', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
					// If your API needs authentication, you might also include authorization headers here
				}
			})

			const data = await response.json()

			if (data.success) {
				recImportStatus = 'Recipes successfully imported!'
			} else {
				recImportStatus = data.error || 'An unknown error occurred.'
			}
		} catch (error) {
			console.error('Error importing recipes:', error)
			recImportStatus = 'Failed to import recipes. Please try again.'
		}
	}
</script>

<h3>Paprika Import</h3>
<div class="container">
	<label for="paprikaUser"> Paprika User </label>
	<input type="text" id="paprikaUser" bind:value={paprikaUser} />
	<label for="paprikaPassword"> Paprika Password </label>
	<input type="password" id="paprikaPassword" bind:value={paprikaPassword} />
	<div class="paprika-files">
		<div class="import-categories">
			<button disabled={catFileExists} on:click={downloadCategories}
				>Download Paprika Categories</button>
			<div class="feedback">
				<div>
					{catFeedbackMessage}
				</div>
				<div>
					Category File: <TrueFalse isTrue={catFileExists} />{#if catFileExists}
						<button
							class="outline secondary"
							disabled={!catFileExists}
							on:click={() => removeFile('categories.json')}
							><Delete width="30px" height="30px" fill="var(--pico-del-color)" /></button>
					{/if}
				</div>
			</div>
			<p>Categories in File: {catFile}</p>
			<p>Categories in DB: {catDb}</p>
			<button
				class="outline secondary"
				disabled={catDb === catFile || catFile === 0 || catFile === null}
				on:click={importCategoriesFromFile}>Import Categories</button>
			<p>{catImportStatus ? catImportStatus : ''}</p>
		</div>
		<div class="import-recipes">
			<button disabled={recFileExists} on:click={downloadRecipes}>Download Paprika Recipes</button>
			<div class="feedback">
				<div>
					{recFeedbackMessage}
				</div>
				<div>
					Recipe File: <TrueFalse isTrue={recFileExists} />{#if recFileExists}
						<button
							class="outline secondary"
							disabled={!recFileExists}
							on:click={() => removeFile('recipes.json')}
							><Delete width="30px" height="30px" fill="var(--pico-del-color)" /></button>
					{/if}
				</div>
			</div>
			<p>Recipes in File: {recFile}</p>
			<p>Recipes in DB: {recDb}</p>
			<button
				class="outline secondary"
				disabled={recDb === recFile || recFile === 0 || recFile === null}
				on:click={importRecipesFromFile}>Import Recipes</button>
			<p>{recImportStatus ? recImportStatus : ''}</p>
		</div>
	</div>
</div>

<style lang="scss">
	.feedback {
		margin: 1rem 0 1rem 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.paprika-files {
		display: flex;
		gap: 1rem;
	}

	.outline.secondary {
		margin-left: 1rem; /* Adjust this value as required */
	}
</style>
