<script>
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Dropdown from '$lib/components/ui/Form/Dropdown.svelte'
	import FileInput from '$lib/components/ui/Form/FileInput.svelte'
	import { t } from '$lib/stores/locale.js'

	let { data, form } = $props()

	let importTypes = $state(data.importTypes || [])
	let selectedType = $state(importTypes[0]?.id || 'paprika')
	let isPublic = $state(!!data?.user?.publicRecipes)
	let busy = $state(false)

	// Transform importTypes for Dropdown component (id -> value)
	let dropdownOptions = $derived(importTypes.map((t) => ({ value: t.id, label: t.label })))

	// Reactive updates based on selected type
	let accept = $derived(importTypes.find((t) => t.id === selectedType)?.accepts?.join(',') || '*/*')
	let info = $derived(importTypes.find((t) => t.id === selectedType)?.info || '')
</script>

<div class="prose max-w-none w-full">
	<h2>{$t('importPage.title')}</h2>
</div>
<form
	method="POST"
	action="?/importRecipes"
	class="flex flex-col gap-4 w-full md:w-2/3 lg:w-1/2"
	enctype="multipart/form-data"
>
	<Dropdown
		name="type"
		legend={$t('importPage.migrationType')}
		options={dropdownOptions}
		bind:selected={selectedType}
		optionalLabel={info}
	/>

	<FileInput id="file" name="file" label={$t('importPage.file')} {accept} required />

	<Checkbox
		name="isPublic"
		bind:checked={isPublic}
		legend={$t('importPage.recipePrivacy')}
		size="sm"
		color="primary"
	>
		{isPublic ? $t('importPage.importPublic') : $t('importPage.importPrivate')}
	</Checkbox>

	<Button type="submit" class="self-start w-auto" aria-busy={busy} disabled={busy}
		>{$t('importPage.importAction')}</Button
	>
</form>

<FeedbackMessage
	message={form?.message || form?.error || ''}
	messageCode={form?.messageCode}
	messageVars={form?.messageVars}
	inline
/>
