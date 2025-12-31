<script>
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Dropdown from '$lib/components/ui/Form/Dropdown.svelte'
	import FileInput from '$lib/components/ui/Form/FileInput.svelte'

	let { data, form } = $props()

	let importTypes = $state(data.importTypes || [])
	let selectedType = $state(importTypes[0]?.id || 'paprika')
	let isPublic = $state(false)
	let busy = $state(false)

	// Transform importTypes for Dropdown component (id -> value)
	let dropdownOptions = $derived(importTypes.map((t) => ({ value: t.id, label: t.label })))

	// Reactive updates based on selected type
	let accept = $derived(importTypes.find((t) => t.id === selectedType)?.accepts?.join(',') || '*/*')
	let info = $derived(importTypes.find((t) => t.id === selectedType)?.info || '')
</script>

<div class="prose max-w-none w-full">
	<h2>Import Recipes</h2>
</div>
<form
	method="POST"
	action="?/importRecipes"
	class="flex flex-col gap-4 w-full md:w-2/3 lg:w-1/2"
	enctype="multipart/form-data">
	<Dropdown
		name="type"
		legend="Choose Migration Type"
		options={dropdownOptions}
		bind:selected={selectedType}
		optionalLabel={info} />

	<FileInput id="file" name="file" label="File" {accept} required />

	<Checkbox
		name="isPublic"
		bind:checked={isPublic}
		legend="Set as Public"
		size="sm"
		color="primary">
		I want to make these recipes public
	</Checkbox>

	<Button class="self-start w-auto" aria-busy={busy} disabled={busy}>Import</Button>
</form>

<FeedbackMessage message={form?.message || form?.error || ''} inline />
