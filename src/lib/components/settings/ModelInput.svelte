<script>
	import Input from '$lib/components/ui/Form/Input.svelte'
	import InfoText from '$lib/components/ui/InfoText.svelte'
	import { providerMeta, providerModelDocs } from '$lib/utils/llmModels.js'
	import { t } from '$lib/stores/locale.js'

	/**
	 * Free-text model field with suggestions fetched live from the provider,
	 * plus a link to the provider's model docs. Lets admins use any model ID
	 * without the app shipping a model catalog that goes stale.
	 *
	 * @type {{
	 *   provider: string,
	 *   type?: 'chat' | 'image' | 'imageGeneration' | 'embedding',
	 *   value?: string,
	 *   id: string,
	 *   placeholder?: string,
	 *   disabled?: boolean
	 * }}
	 */
	let {
		provider,
		type = 'chat',
		value = $bindable(''),
		id,
		placeholder = '',
		disabled = false
	} = $props()

	let models = $state([])
	let loading = $state(false)
	let loadError = $state('')
	let requestId = 0

	let providerLabel = $derived(providerMeta.find((p) => p.value === provider)?.label || provider)
	let docsUrl = $derived(providerModelDocs[provider] || '')
	let listId = $derived(`${id}-options`)

	$effect(() => {
		loadModels(provider, type)
	})

	async function loadModels(currentProvider, currentType) {
		const thisRequest = ++requestId
		models = []
		loadError = ''
		if (!currentProvider) return

		loading = true
		try {
			const params = new URLSearchParams({ provider: currentProvider, type: currentType })
			const response = await fetch(`/api/llm/models?${params}`)
			const result = await response.json()
			if (thisRequest !== requestId) return
			if (result.ok) {
				models = result.models || []
			} else {
				loadError = result.error || $t('admin.site.connectionFailed')
			}
		} catch (err) {
			if (thisRequest === requestId) loadError = err.message
		} finally {
			if (thisRequest === requestId) loading = false
		}
	}
</script>

<div class="flex flex-col gap-1">
	<Input
		type="text"
		{id}
		label={$t('admin.site.model')}
		placeholder={placeholder || $t('admin.site.modelPlaceholder')}
		list={listId}
		{disabled}
		bind:value />
	<datalist id={listId}>
		{#each models as model (model.value)}
			<option value={model.value}>{model.label}</option>
		{/each}
	</datalist>
	<InfoText>
		{#if loading}
			{$t('admin.site.modelsLoading', { provider: providerLabel })}
		{:else if loadError}
			<span class="text-error">{$t('admin.site.modelsLoadFailed', { error: loadError })}</span>
		{:else if provider}
			{$t('admin.site.modelsAvailable', { count: models.length, provider: providerLabel })}
		{/if}
		{#if docsUrl}
			<a class="link" href={docsUrl} target="_blank" rel="noopener noreferrer">
				{$t('admin.site.browseModels', { provider: providerLabel })}
			</a>
		{/if}
	</InfoText>
</div>
