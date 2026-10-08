<script>
	import Input from '$lib/components/ui/Form/Input.svelte'
	import InfoText from '$lib/components/ui/InfoText.svelte'
	import Spinner from '$lib/components/ui/Spinner.svelte'
	import { providerMeta, providerModelDocs } from '$lib/utils/llmModels.js'
	import { t } from '$lib/stores/locale.js'

	/**
	 * Free-text model field with suggestions fetched live from the provider,
	 * plus a link to the provider's model docs. Lets admins use any model ID
	 * without the app shipping a model catalog that goes stale.
	 *
	 * Suggestions open in a dropdown on focus (with a spinner while the list loads)
	 * and filter as you type. Follows the ARIA combobox pattern.
	 *
	 * @type {{
	 *   provider: string,
	 *   type?: 'chat' | 'image' | 'imageGeneration' | 'embedding',
	 *   value?: string,
	 *   id: string,
	 *   placeholder?: string,
	 *   disabled?: boolean,
	 *   service?: { name: string, docsUrl: string } | null
	 * }}
	 */
	let {
		provider,
		type = 'chat',
		value = $bindable(''),
		id,
		placeholder = '',
		disabled = false,
		// The service behind the OpenAI-compatible provider, if recognised (e.g. OpenRouter)
		service = null
	} = $props()

	let models = $state([])
	let loading = $state(false)
	let loadError = $state('')
	let open = $state(false)
	let filterText = $state('')
	let activeIndex = $state(-1)
	let listbox = $state()
	let requestId = 0

	let compatService = $derived(provider === 'openai_compatible' ? service : null)
	let providerLabel = $derived(
		compatService?.name || providerMeta.find((p) => p.value === provider)?.label || provider
	)
	let docsUrl = $derived(compatService ? compatService.docsUrl : providerModelDocs[provider] || '')
	let listboxId = $derived(`${id}-listbox`)
	let filteredModels = $derived.by(() => {
		const query = filterText.trim().toLowerCase()
		if (!query) return models
		return models.filter(
			(m) => m.value.toLowerCase().includes(query) || m.label.toLowerCase().includes(query)
		)
	})

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

	function openList() {
		if (disabled || !provider) return
		// Show the full list on open; typing narrows it
		filterText = ''
		activeIndex = -1
		open = true
		if (loadError && !loading) loadModels(provider, type)
	}

	function closeList() {
		open = false
		activeIndex = -1
	}

	/** @param {{ value: string }} model */
	function choose(model) {
		value = model.value
		closeList()
	}

	/** @param {number} index */
	function setActive(index) {
		activeIndex = index
		listbox?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' })
	}

	/** @param {Event & { currentTarget: HTMLInputElement }} event */
	function handleInput(event) {
		filterText = event.currentTarget.value
		activeIndex = -1
		open = true
	}

	/** @param {KeyboardEvent} event */
	function handleKeydown(event) {
		const count = filteredModels.length
		if (event.key === 'ArrowDown') {
			event.preventDefault()
			if (!open) openList()
			else if (count) setActive((activeIndex + 1) % count)
		} else if (event.key === 'ArrowUp') {
			event.preventDefault()
			if (open && count) setActive(activeIndex <= 0 ? count - 1 : activeIndex - 1)
		} else if (event.key === 'Enter') {
			if (open && activeIndex >= 0 && filteredModels[activeIndex]) {
				event.preventDefault()
				choose(filteredModels[activeIndex])
			}
		} else if (event.key === 'Escape') {
			if (open) {
				event.preventDefault()
				closeList()
			}
		}
	}
</script>

<div class="flex flex-col gap-1">
	<div class="relative">
		<Input
			type="text"
			{id}
			label={$t('admin.site.model')}
			placeholder={placeholder || $t('admin.site.modelPlaceholder')}
			{disabled}
			bind:value
			autocomplete="off"
			role="combobox"
			aria-autocomplete="list"
			aria-expanded={open}
			aria-controls={listboxId}
			aria-activedescendant={open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
			onfocus={openList}
			onclick={() => !open && openList()}
			onblur={closeList}
			oninput={handleInput}
			onkeydown={handleKeydown} />

		{#if open}
			<div
				class="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-1 shadow-lg">
				{#if loading}
					<div class="flex items-center gap-2 px-3 py-2 text-sm" role="status">
						<Spinner visible inline size="sm" inlineClass="shrink-0" />
						<span>{$t('admin.site.modelsLoading', { provider: providerLabel })}</span>
					</div>
				{:else if loadError}
					<p class="px-3 py-2 text-sm text-error" role="status">
						{$t('admin.site.modelsLoadFailed', { error: loadError })}
					</p>
				{:else if filteredModels.length === 0}
					<p class="px-3 py-2 text-sm text-base-content/70" role="status">
						{$t('admin.site.modelsNoMatch')}
					</p>
				{/if}
				<ul bind:this={listbox} id={listboxId} role="listbox" class="menu w-full p-0">
					{#if !loading && !loadError}
						{#each filteredModels as model, index (model.value)}
							<!-- mousedown (not click) so the choice lands before the input blurs -->
							<li
								id={`${id}-option-${index}`}
								data-index={index}
								role="option"
								aria-selected={index === activeIndex}
								onmousedown={(event) => {
									event.preventDefault()
									choose(model)
								}}>
								<span
									class="flex flex-col items-start gap-0"
									class:menu-active={index === activeIndex}
									class:font-semibold={model.value === value}>
									<span class="break-all">{model.value}</span>
									{#if model.label !== model.value}
										<span class="text-xs text-base-content/60"
											>{model.label.replace(` (${model.value})`, '')}</span>
									{/if}
								</span>
							</li>
						{/each}
					{/if}
				</ul>
			</div>
		{/if}
	</div>
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
