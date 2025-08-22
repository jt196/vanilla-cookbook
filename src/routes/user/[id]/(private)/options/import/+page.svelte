<script>
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	let { data, form } = $props()

	let importTypes = $state(data.importTypes || [])
	let selectedType = $state(importTypes[0]?.id || 'paprika')
	let isPublic = $state(false)
	let busy = $state(false)

	let accept = $state(importTypes.find((t) => t.id === selectedType)?.accepts?.join(',') || '*/*')
	let info = $state(importTypes.find((t) => t.id === selectedType)?.info || '')

	function onTypeChange(e) {
		selectedType = e.target.value
		const t = importTypes.find((t) => t.id === selectedType)
		accept = t?.accepts?.join(',') || '*/*'
		info = t?.info || ''
	}

	function labelFor(id) {
		return importTypes.find((t) => t.id === id)?.label || id
	}
</script>

<h2>Import Recipes</h2>

<form method="POST" action="?/importRecipes" enctype="multipart/form-data">
	<h5>Choose Migration Type</h5>
	<details class="dropdown">
		<summary>{labelFor(selectedType)}</summary>
		<ul>
			{#each importTypes as t}
				<li>
					<label>
						<input
							type="radio"
							name="type"
							bind:group={selectedType}
							value={t.id}
							checked={t.id === selectedType}
							onchange={onTypeChange} />
						{t.label}
					</label>
				</li>
			{/each}
		</ul>
	</details>

	{#if info}
		<p class="import-hint">{info}</p>
	{/if}

	<label for="file">File</label>
	<input id="file" name="file" type="file" {accept} required />

	<label>
		<input type="checkbox" name="isPublic" bind:checked={isPublic} />
		I want to make these recipes public
	</label>

	<button aria-busy={busy} disabled={busy}>Import</button>
</form>

<div class="feedback">
	<FeedbackMessage message={form?.message || form?.error || ''} />
</div>

<style lang="scss">
	.feedback {
		margin: 1rem 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.import-hint {
		margin: 0.5rem 0 1rem 0;
		font-size: 0.9rem;
		opacity: 0.8;
	}
</style>
