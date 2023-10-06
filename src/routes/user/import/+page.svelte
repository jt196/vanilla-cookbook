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

	let feedbackMessage
	let catFileExists = false
	let recFileExists = false

	onMount(async () => {
		await checkCategoryFileExists(user.userId)
	})

	async function downloadCategories() {
		const response = await fetch('/api/import/paprika/categories', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ paprikaUser, paprikaPassword })
		})

		const result = await response.json()
		if (response.ok) {
			await checkCategoryFileExists(user.userId)
		} else {
			feedbackMessage = result.error
		}
	}

	async function downloadRecipes() {
		const response = await fetch('/api/import/paprika/recipes', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ paprikaUser, paprikaPassword })
		})

		const result = await response.json()
		if (response.ok) {
			await checkRecipeFileExists(user.userId)
		} else {
			feedbackMessage = result.error
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
			catFileExists = exists
		} else {
			catFileExists = false
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
			<p class="feedback">
				Category File: <TrueFalse isTrue={catFileExists} />{#if catFileExists}
					<button
						class="outline secondary"
						disabled={!catFileExists}
						on:click={() => removeFile('categories.json')}
						><Delete width="30px" height="30px" fill="var(--pico-del-color)" /></button>
				{/if}
			</p>
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
			<p class="feedback">
				Category File: <TrueFalse isTrue={recFileExists} />{#if recFileExists}
					<button
						class="outline secondary"
						disabled={!recFileExists}
						on:click={() => removeFile('recipes.json')}
						><Delete width="30px" height="30px" fill="var(--pico-del-color)" /></button>
				{/if}
			</p>
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
		margin-top: 1rem;
	}

	.paprika-files {
		display: flex;
		gap: 1rem;
	}
</style>
