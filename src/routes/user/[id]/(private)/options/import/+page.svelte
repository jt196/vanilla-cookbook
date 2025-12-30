<script>
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Dropdown from '$lib/components/ui/Form/Dropdown.svelte'
	import FileInput from '$lib/components/ui/Form/FileInput.svelte'
	import Hint from '$lib/components/ui/Hint.svelte'

	let { data, form } = $props()

	let importTypes = $state(data.importTypes || [])
	let selectedType = $state(importTypes[0]?.id || 'paprika')
	let isPublic = $state(false)
	let busy = $state(false)

	// Transform importTypes for Dropdown component (id -> value)
	let dropdownOptions = $derived(importTypes.map((t) => ({ value: t.id, label: t.label })))

	// Reactive updates based on selected type
	let accept = $derived(
		importTypes.find((t) => t.id === selectedType)?.accepts?.join(',') || '*/*'
	)
	let info = $derived(importTypes.find((t) => t.id === selectedType)?.info || '')
</script>

<h2>Import Recipes</h2>

<form method="POST" action="?/importRecipes" enctype="multipart/form-data">
	<h5>Choose Migration Type</h5>
	<Dropdown name="type" options={dropdownOptions} bind:selected={selectedType} />

	<Hint text={info} />

	<FileInput id="file" name="file" label="File" accept={accept} required />

	<Checkbox
		name="isPublic"
		bind:checked={isPublic}
		label="I want to make these recipes public"
		size="sm"
		color="primary" />

	<Button aria-busy={busy} disabled={busy}>Import</Button>
</form>

<FeedbackMessage message={form?.message || form?.error || ''} inline />
