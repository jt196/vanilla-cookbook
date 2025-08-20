<script>
	import Export from '$lib/components/svg/Export.svelte'

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

<p>Click this to download all your recipes in Paprika format.</p>
<p>Currently, we don't support exporting images.</p>

<button data-tooltip="Export Filtered Recipes" onclick={handleExport}
	><Export width="30px" height="30px" /></button>
