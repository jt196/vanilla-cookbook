<script>
	import TrueFalse from '$lib/components/TrueFalse.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import { importFileExists } from '$lib/utils/crud.js'
	import { onMount } from 'svelte'
	export let data
	const { user, categoryCount } = data
	console.log('🚀 ~ file: +page.svelte:8 ~ categoryCount:', categoryCount)

	let paprikaUser = ''
	let paprikaPassword = ''

	let feedbackMessage
	let fileExists = false

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

	// Example Usage:
	async function checkCategoryFileExists() {
		const filename = 'categories.json'
		const exists = await importFileExists(filename)
		console.log('🚀 ~ file: +page.svelte:39 ~ checkCategoryFileExists ~ exists:', exists)
		if (exists) {
			fileExists = exists
		} else {
			fileExists = false
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
</script>

<h3>Paprika Import</h3>
<div class="container">
	<label for="paprikaUser"> Paprika User </label>
	<input type="text" id="paprikaUser" bind:value={paprikaUser} />
	<label for="paprikaPassword"> Paprika Password </label>
	<input type="password" id="paprikaPassword" bind:value={paprikaPassword} />
	<button disabled={fileExists} on:click={downloadCategories}>Download Paprika Categories</button>
	<p class="feedback">
		Category File: <TrueFalse isTrue={fileExists} />{#if fileExists}
			<button
				class="outline secondary"
				disabled={!fileExists}
				on:click={() => removeFile('categories.json')}
				><Delete width="30px" height="30px" fill="var(--pico-del-color)" /></button>
		{/if}
	</p>
	<p>Categories in File: {categoryCount.file}</p>
	<p>Categories in DB: {categoryCount.db}</p>
</div>

<style lang="scss">
	.feedback {
		margin-top: 1rem;
	}
</style>
