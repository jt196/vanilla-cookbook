<script>
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import TrueFalse from '$lib/components/TrueFalse.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import {
		dbCatCount,
		dbRecCount,
		fileCatCount,
		fileRecCount,
		importFileExists
	} from '$lib/utils/crud.js'
	import { onMount } from 'svelte'

	export let data
	const { user, importCount } = data

	let catDb = importCount.catDb
	let recDb = importCount.recDb
	let catFile = importCount.catFile
	let recFile = importCount.recFile

	let paprikaUser = ''
	let paprikaPassword = ''

	let catFeedbackMessage = ''
	let recFeedbackMessage = ''
	let catFileExists = false
	let recFileExists = false
	let importCatBusy = false
	let importRecBusy = false
	let downloadCatBusy = false
	let downloadRecBusy = false

	let isPublic = false

	onMount(async () => {
		await checkCategoryFileExists(user.userId)
		await checkRecipeFileExists(user.userId)
	})

	async function downloadCategories() {
		// 1. Update the feedbackMessage to notify the user that the process has started
		catFeedbackMessage = 'Importing categories, please wait!'
		downloadCatBusy = true

		try {
			const response = await fetch('/api/import/paprika/categories', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ paprikaUser, paprikaPassword })
			})

			const result = await response.json()
			downloadCatBusy = false
			// 2. Update the catFeedbackMessage based on the server's response
			if (response.ok) {
				await checkCategoryFileExists()
				catFile = await fileCatCount()
				catFeedbackMessage = 'Categories imported successfully!'
			} else {
				catFeedbackMessage = result.error
			}
		} catch (error) {
			// Handle any unexpected errors during the fetch
			catFeedbackMessage = 'An unexpected error occurred. Please try again later.'
			console.error('Error downloading categories:', error)
		}
	}

	async function downloadRecipes() {
		// 1. Update the feedbackMessage to notify the user that the process has started
		recFeedbackMessage = 'Importing recipes, please wait!'
		downloadRecBusy = true

		try {
			const response = await fetch('/api/import/paprika/recipes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ paprikaUser, paprikaPassword })
			})

			const result = await response.json()

			downloadRecBusy = false
			// 2. Update the recFeedbackMessage based on the server's response
			if (response.ok) {
				await checkRecipeFileExists()
				recFile = await fileRecCount()
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
		if (exists) {
			catFileExists = exists
		} else {
			catFileExists = false
		}
	}

	async function checkRecipeFileExists() {
		const filename = 'recipes.json'
		const exists = await importFileExists(filename)
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
			if (filename.includes('categories')) {
				// Check for file existence
				await checkCategoryFileExists()
				// Update the category count in the file
				catFile = await fileCatCount()
				catFeedbackMessage = 'Category File Deleted!'
			} else {
				await checkRecipeFileExists()
				recFile = await fileRecCount()
				recFeedbackMessage = 'Recipe File Deleted!'
			}
		}
	}

	let catImportStatus = null
	let recImportStatus = null

	async function importCategoriesFromFile() {
		try {
			const response = await fetch('/api/import/paprika/categories', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
					// If your API needs authentication, you might also include authorization headers here
				}
			})
			catImportStatus = 'Importing categories from file!'
			importCatBusy = true

			const data = await response.json()

			importCatBusy = false

			if (response.status === 200) {
				catImportStatus = 'Categories successfully imported!'
				catDb = await dbCatCount(user.userId)
				try {
					const response = await fetch(`/api/user/${user.userId}/categories/count`)
					const data = await response.json()
					if (data && data.count) {
						catDb = data.count
					}
				} catch (err) {
					console.error('Error fetching category db count:', err)
				}
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
				},
				body: JSON.stringify({ isPublic })
			})

			importRecBusy = true

			const data = await response.json()

			response ? (importRecBusy = false) : null

			if (response.status === 200) {
				recImportStatus = 'Recipes successfully imported!'
				recDb = await dbRecCount(user.userId)
			} else {
				recImportStatus = data.error || 'An unknown error occurred.'
			}
		} catch (error) {
			console.error('Error importing recipes:', error)
			recImportStatus = 'Failed to import recipes. Please try again.'
		}
	}
</script>

<h3>Paprika API Import</h3>
<p>
	1. Download your categories by entering your username and password, then pressing the <strong
		>Download Paprika Categories</strong> button.
</p>
<p>2. If the Category File is there (look for a tick!), press <strong>Import Categories</strong></p>
<p>3. Delete the file, or hang on to it.</p>
{#if user.isAdmin}
	<p>
		4. Download, then import your recipes. This will take a short while if you've a few recipes. You
		might find exporting them from the app is a little quicker.
	</p>
	<p>
		<i
			>Please note: access to the images in the recipes have a limited time, if you want to download
			them with your recipes, do this soon after you download the recipes.</i>
	</p>
{/if}
<div class="container">
	<label for="paprikaUser"> Paprika User </label>
	<input type="text" id="paprikaUser" bind:value={paprikaUser} />
	<label for="paprikaPassword"> Paprika Password </label>
	<input type="password" id="paprikaPassword" bind:value={paprikaPassword} />
	<div class="paprika-api">
		<div class="import-categories">
			<button aria-busy={downloadCatBusy} disabled={catFileExists} on:click={downloadCategories}
				>Download Paprika Categories</button>
			<div class="feedback">
				<FeedbackMessage message={catFeedbackMessage} />
				<div class="file-manage">
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
				aria-busy={importCatBusy}
				class="outline secondary delete"
				disabled={catDb === catFile || catFile === 0 || catFile === null}
				on:click={importCategoriesFromFile}>Import Categories</button>
			<FeedbackMessage message={catImportStatus} />
		</div>
		{#if user.isAdmin}
			<div class="import-recipes">
				<button disabled={recFileExists} aria-busy={downloadRecBusy} on:click={downloadRecipes}
					>Download Paprika Recipes</button>
				<div class="feedback">
					<FeedbackMessage message={recFeedbackMessage} />
					<div class="file-manage">
						Recipe File: <TrueFalse isTrue={recFileExists} />{#if recFileExists}
							<button
								class="outline secondary delete"
								disabled={!recFileExists}
								on:click={() => removeFile('recipes.json')}
								><Delete width="30px" height="30px" fill="var(--pico-del-color)" /></button>
						{/if}
					</div>
				</div>
				<p>Recipes in File: {recFile}</p>
				<p>Recipes in DB: {recDb}</p>
				<label>
					<input
						type="checkbox"
						data-tooltip="Make your imported recipes public"
						name="Recipes Public"
						bind:checked={isPublic} />
					Recipes Public
				</label>
				<button
					aria-busy={importRecBusy}
					class="outline secondary"
					disabled={recDb === recFile || recFile === 0 || recFile === null}
					on:click={importRecipesFromFile}>Import Recipes</button>
				<FeedbackMessage message={recImportStatus} />
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.feedback {
		margin: 1rem 0 1rem 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.paprika-api {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		justify-content: space-between;
		.import-categories,
		.import-recipes {
			width: 50%;
		}
	}

	.file-manage {
		button {
			margin-left: 1rem;
		}
	}
</style>
