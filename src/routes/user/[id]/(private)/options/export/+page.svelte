<script>
	import Export from '$lib/components/svg/Export.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	async function handleExport() {
		const response = await fetch('/api/recipe/export', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		})

		if (response.ok) {
			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.style.display = 'none'
			a.href = url
			a.download = 'export.paprikarecipes' // Name of the file to be downloaded
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
		} else {
			console.error('Failed to export recipes')
		}
	}
</script>

<div class="prose mb-3">
	<h2>Export Recipes</h2>
	<p>Click this to download all your recipes in Paprika format.</p>
</div>

<Button class="tooltip" data-tip="Export Filtered Recipes" onclick={handleExport}>
	<Export width="30px" height="30px" />
</Button>
