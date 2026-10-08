<script>
	import { untrack } from 'svelte'
	import { localDateAndTime } from '$lib/utils/dateTime'
	import { invalidateAll } from '$app/navigation'
	import {
		getProviderOptionsWithAvailability,
		getEmbeddingProviderOptionsWithAvailability,
		providerSupports,
		defaultEmbeddingModels,
		resolveEmbeddingModel
	} from '$lib/utils/llmModels.js'
	import ModelInput from '$lib/components/settings/ModelInput.svelte'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Badge from '$lib/components/ui/Badge.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Dropdown from '$lib/components/ui/Form/Dropdown.svelte'
	import Table from '$lib/components/ui/Table/Table.svelte'
	import TableHead from '$lib/components/ui/Table/TableHead.svelte'
	import TableBody from '$lib/components/ui/Table/TableBody.svelte'
	import TableRow from '$lib/components/ui/Table/TableRow.svelte'
	import TableCell from '$lib/components/ui/Table/TableCell.svelte'
	import InfoText from '$lib/components/ui/InfoText.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import { t } from '$lib/stores/locale.js'
	import { get } from 'svelte/store'

	/** @type {{data: any}} */
	let { data } = $props()

	const { settings, llmConfig, passwordRequirements, passwordRequirementsDescription, oauth } =
		$state(untrack(() => data))

	let oidcEnabled = $derived(oauth?.oidcEnabled ?? false)

	let settingsFeedback = $state('')
	let settingsFeedbackCode = $state(null)
	let llmFeedback = $state('')
	let llmFeedbackCode = $state(null)
	let backupInfo = $state(untrack(() => data.backupInfo))
	let backupError = $state(untrack(() => data.backupError || ''))
	let backupErrorCode = $state(untrack(() => data.backupErrorCode || null))
	let backupInProgress = $state(false)
	let backupFeedback = $state('')
	let backupFeedbackCode = $state(null)
	let embeddingInProgress = $state(false)
	let embeddingFeedback = $state('')
	let embeddingBatchResult = $state(null)
	let embeddingIndex = $state(
		untrack(() => data.embeddingIndex || { total: 0, remaining: 0, mismatched: 0, completed: 0 })
	)
	let embeddingPercent = $derived(
		embeddingIndex.total > 0
			? Math.round((Math.max(embeddingIndex.completed, 0) / embeddingIndex.total) * 100)
			: 0
	)

	// Connection test state
	let providerTestDialogOpen = $state(false)
	let providerTestsRunning = $state(false)
	let providerTestResults = $state([])

	// LLM form state
	let llmEnabled = $state(llmConfig.dbEnabled)
	let semanticEnabled = $state(llmConfig.dbSemanticEnabled ?? false)
	const initialSemanticProvider =
		llmConfig.dbSemanticEmbeddingProvider || llmConfig.semanticSelectedProvider || ''
	let semanticEmbeddingProvider = $state(initialSemanticProvider)
	let semanticEmbeddingModel = $state(
		llmConfig.dbSemanticEmbeddingModel || llmConfig.semanticModel || ''
	)
	const initialTextProvider = llmConfig.dbProvider || llmConfig.availableProviders[0] || ''
	const initialImageProvider =
		llmConfig.dbImageProvider || llmConfig.imageProvider || initialTextProvider
	const initialImageGenerationProvider =
		llmConfig.dbImageGenerationProvider || llmConfig.imageGenerationProvider || initialTextProvider
	let llmProvider = $state(initialTextProvider)
	let llmImageProvider = $state(initialImageProvider)
	let llmImageGenerationProvider = $state(initialImageGenerationProvider)

	let textModel = $state(llmConfig.dbTextModel || '')
	let imageModel = $state(llmConfig.dbImageModel || '')
	let imageGenerationModel = $state(llmConfig.dbImageGenerationModel || '')

	// Model IDs are provider-specific, so clear the model when its provider changes
	let previousProvider = initialTextProvider
	let previousImageProvider = initialImageProvider
	let previousImageGenerationProvider = initialImageGenerationProvider
	let previousSemanticProvider = initialSemanticProvider
	$effect(() => {
		if (llmProvider !== previousProvider) {
			previousProvider = llmProvider
			textModel = ''
		}
	})
	$effect(() => {
		if (llmImageProvider !== previousImageProvider) {
			previousImageProvider = llmImageProvider
			imageModel = ''
		}
	})
	$effect(() => {
		if (llmImageGenerationProvider !== previousImageGenerationProvider) {
			previousImageGenerationProvider = llmImageGenerationProvider
			imageGenerationModel = ''
		}
	})
	$effect(() => {
		if (semanticEmbeddingProvider !== previousSemanticProvider) {
			previousSemanticProvider = semanticEmbeddingProvider
			semanticEmbeddingModel = ''
		}
	})

	let supportsImages = $derived(providerSupports(llmImageProvider, 'image'))
	let supportsImageGeneration = $derived(
		providerSupports(llmImageGenerationProvider, 'imageGeneration')
	)
	let semanticProviderOptions = $derived(
		getEmbeddingProviderOptionsWithAvailability(llmConfig.semanticAvailableProviders)
	)
	let effectiveSemanticProvider = $derived(
		semanticEmbeddingProvider || llmConfig.semanticProvider || null
	)
	let semanticProviderConfigured = $derived(
		!!effectiveSemanticProvider &&
			(llmConfig.semanticAvailableProviders || []).includes(effectiveSemanticProvider)
	)
	let defaultSemanticModel = $derived(defaultEmbeddingModels[effectiveSemanticProvider] || '')
	// Recipes are embedded with the saved model; switching models makes those vectors incomparable
	let indexedEmbeddingModel = $derived(
		resolveEmbeddingModel(data.llmConfig?.semanticProvider, data.llmConfig?.semanticModel)
	)
	let indexedRecipeCount = $derived(embeddingIndex.completed + (embeddingIndex.mismatched || 0))
	let embeddingModelChanged = $derived(
		!!effectiveSemanticProvider &&
			resolveEmbeddingModel(effectiveSemanticProvider, semanticEmbeddingModel.trim()) !==
				indexedEmbeddingModel
	)
	let canGenerateEmbeddings = $derived(
		semanticEnabled &&
			semanticProviderConfigured &&
			!!effectiveSemanticProvider &&
			embeddingIndex.remaining > 0
	)
	let canRegenerateMismatched = $derived(
		semanticEnabled &&
			semanticProviderConfigured &&
			!!effectiveSemanticProvider &&
			(embeddingIndex.mismatched || 0) > 0
	)

	// Trimmed model values to save and test
	let effectiveTextModel = $derived(textModel.trim())
	let effectiveImageModel = $derived(imageModel.trim())
	let effectiveImageGenerationModel = $derived(imageGenerationModel.trim())

	let availableProviderOptions = $derived(
		getProviderOptionsWithAvailability(llmConfig.availableProviders)
	)

	async function updateAdminSettings(event) {
		event.preventDefault()
		const response = await fetch('/api/site', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(settings)
		})
		if (response.ok) {
			settingsFeedback = get(t)('admin.site.msg.settingsUpdated')
			settingsFeedbackCode = null
		} else {
			const error = await response.json().catch(() => ({}))
			settingsFeedback = error.error || error.message || ''
			settingsFeedbackCode = error.code || 'admin.site.msg.settingsUpdateFail'
		}
	}

	async function updateLlmSettings(event) {
		event.preventDefault()
		const response = await fetch('/api/site', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...settings,
				llmEnabled,
				semanticEnabled,
				llmProvider,
				llmImageProvider,
				llmImageGenerationProvider,
				llmTextModel: effectiveTextModel || null,
				llmImageModel: supportsImages ? effectiveImageModel || null : null,
				llmImageGenerationModel: effectiveImageGenerationModel || null,
				semanticEmbeddingProvider: semanticEmbeddingProvider || null,
				semanticEmbeddingModel: semanticEmbeddingModel.trim() || null
			})
		})
		if (response.ok) {
			llmFeedback = get(t)('admin.site.msg.llmUpdated')
			llmFeedbackCode = null
			await invalidateAll()
		} else {
			const error = await response.json().catch(() => ({}))
			llmFeedback = error.error || error.message || ''
			llmFeedbackCode = error.code || 'admin.site.msg.llmUpdateFail'
		}
	}

	async function createManualBackup() {
		backupInProgress = true
		backupFeedback = ''
		try {
			const response = await fetch('/api/site/backups', {
				method: 'POST'
			})
			if (response.ok) {
				const result = await response.json()
				backupFeedback = result.message || ''
				backupFeedbackCode = result.code || null
				// Refresh the data from server
				await invalidateAll()
			} else {
				const error = await response.json()
				backupFeedback = error.error || ''
				backupFeedbackCode = error.code || 'admin.site.msg.backupFail'
			}
		} catch (error) {
			backupFeedback = error.message
			backupFeedbackCode = 'admin.site.msg.backupError'
		} finally {
			backupInProgress = false
		}
	}

	async function generateEmbeddingBatch(force = false) {
		embeddingInProgress = true
		embeddingFeedback = ''
		embeddingBatchResult = null
		let processedTotal = 0
		let failedTotal = 0
		try {
			// Keep running batches until index is complete or no progress is possible.
			while (true) {
				const response = await fetch('/api/embeddings/generate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ batchSize: 25, force })
				})
				const data = await response.json().catch(() => ({}))
				if (!response.ok) {
					embeddingFeedback = data.error || data.reason || get(t)('admin.site.msg.embeddingError')
					return
				}

				processedTotal += data.processed || 0
				failedTotal += data.failed || 0
				embeddingBatchResult = data
				embeddingIndex = {
					total: embeddingIndex.total,
					remaining: force
						? embeddingIndex.remaining
						: (data.remaining ?? embeddingIndex.remaining),
					mismatched: force
						? (data.remaining ?? embeddingIndex.mismatched)
						: embeddingIndex.mismatched,
					completed: Math.max(
						(embeddingIndex.total || 0) -
							(force ? embeddingIndex.remaining : data.remaining || 0) -
							(force ? data.remaining || 0 : embeddingIndex.mismatched),
						0
					)
				}

				if (data.remaining === 0) break
				if (data.rateLimited) {
					embeddingFeedback = get(t)('admin.site.msg.embeddingRateLimit', {
						count: processedTotal
					})
					return
				}
				if ((data.processed || 0) === 0) break
			}

			embeddingFeedback = get(t)('admin.site.msg.embeddingComplete', {
				processed: processedTotal,
				failed: failedTotal
			})
		} catch (error) {
			embeddingFeedback = `${get(t)('admin.site.msg.embeddingError')} ${error.message}`
		} finally {
			embeddingInProgress = false
		}
	}

	// Update backupInfo when data changes
	$effect(() => {
		backupInfo = data.backupInfo
		backupError = data.backupError || ''
		backupErrorCode = data.backupErrorCode || null
		embeddingIndex = data.embeddingIndex || { total: 0, remaining: 0, mismatched: 0, completed: 0 }
	})

	async function testConnection(provider, model, type) {
		try {
			const response = await fetch('/api/llm/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ provider, model, type })
			})
			return await response.json()
		} catch (err) {
			return {
				ok: false,
				error: err.message || get(t)('admin.site.connectionFailed'),
				code: 'admin.site.msg.connectionFailed'
			}
		}
	}

	function getEnabledProviderChecks() {
		/** @type {Array<{key: string, label: string, provider: string, model: string | undefined, type: 'chat' | 'embedding' | 'imageGeneration'}>} */
		const checks = []

		if (llmEnabled && llmProvider) {
			checks.push({
				key: 'text',
				label: get(t)('admin.site.textSection'),
				provider: llmProvider,
				model: effectiveTextModel || undefined,
				type: 'chat'
			})
		}

		if (llmEnabled && llmImageProvider) {
			checks.push({
				key: 'image-ocr',
				label: get(t)('admin.site.imageOcr'),
				provider: llmImageProvider,
				model: effectiveImageModel || undefined,
				type: 'chat'
			})
		}

		if (llmEnabled && llmImageGenerationProvider) {
			checks.push({
				key: 'image-generation',
				label: get(t)('admin.site.imageGen'),
				provider: llmImageGenerationProvider,
				model: effectiveImageGenerationModel || undefined,
				type: 'imageGeneration'
			})
		}

		if (semanticEnabled && semanticProviderConfigured && effectiveSemanticProvider) {
			checks.push({
				key: 'embeddings',
				label: get(t)('admin.site.embeddings'),
				provider: effectiveSemanticProvider,
				model: semanticEmbeddingModel.trim() || undefined,
				type: 'embedding'
			})
		}

		return checks
	}

	async function runEnabledProviderTests() {
		const checks = getEnabledProviderChecks()
		providerTestDialogOpen = true
		providerTestResults = checks.map((check) => ({
			...check,
			status: 'pending',
			latencyMs: null,
			error: '',
			errorCode: null
		}))

		if (!checks.length) {
			return
		}

		providerTestsRunning = true
		try {
			for (const [index, check] of checks.entries()) {
				const result = await testConnection(check.provider, check.model, check.type)
				providerTestResults = providerTestResults.map((row, rowIndex) =>
					rowIndex === index
						? {
								...row,
								status: result.ok ? 'success' : 'error',
								latencyMs: result?.latencyMs ?? null,
								error: result?.error || '',
								errorCode: result?.code || null
							}
						: row
				)
			}
		} finally {
			providerTestsRunning = false
		}
	}
</script>

<h3>{$t('admin.site.updateSiteSettings')}</h3>
<div class="w-full md:w-3/4 lg:w-2/3 space-y-4 mb-3">
	<form
		method="POST"
		action="?/updateAdminSettings"
		onsubmit={updateAdminSettings}
		class="flex flex-col gap-3">
		<Checkbox
			name="registrationAllowed"
			bind:checked={settings.registrationAllowed}
			legend={$t('admin.site.allowRegistrations')}
			size="sm"
			color="primary">
			{settings.registrationAllowed
				? $t('admin.site.registrationEnabled')
				: $t('admin.site.registrationDisabled')}</Checkbox>
		<Checkbox
			name="requireLogin"
			bind:checked={settings.requireLogin}
			legend={$t('admin.site.requireLogin')}
			size="sm"
			color="primary">
			{settings.requireLogin
				? $t('admin.site.requireLoginEnabled')
				: $t('admin.site.requireLoginDisabled')}</Checkbox>
		<InfoText>{$t('admin.site.requireLoginHint')}</InfoText>
		{#if oidcEnabled}
			<Checkbox
				name="oidcAutoProvision"
				bind:checked={settings.oidcAutoProvision}
				legend={$t('admin.site.oidcAutoProvision')}
				size="sm"
				color="primary">
				{settings.oidcAutoProvision
					? $t('admin.site.oidcEnabled')
					: $t('admin.site.oidcDisabled')}</Checkbox>
			<InfoText>{$t('admin.site.oidcHint')}</InfoText>
		{/if}
		<footer class="flex flex-col gap-2">
			<Button type="submit" class="self-start w-auto">{$t('admin.site.update')}</Button>
			<FeedbackMessage message={settingsFeedback} messageCode={settingsFeedbackCode} inline />
		</footer>
	</form>
</div>

<div class="w-full md:w-3/4 lg:w-2/3 space-y-2 mb-3">
	<h3>{$t('admin.site.llmConfig')}</h3>
	{#if !llmConfig.hasAnyApiKey}
		<div class="rounded-box border border-base-300 bg-base-200 p-4">
			<InfoText>{$t('admin.site.llmNoKeys')}</InfoText>
		</div>
	{:else}
		<form onsubmit={updateLlmSettings} class="flex flex-col gap-4">
			<Checkbox
				name="llmEnabled"
				bind:checked={llmEnabled}
				legend={$t('admin.site.enableLlm')}
				size="sm"
				color="primary">
				{llmEnabled ? $t('admin.site.llmEnabled') : $t('admin.site.llmDisabled')}
			</Checkbox>

			{#if llmEnabled}
				<div class="rounded-box border border-base-300 bg-base-200 p-3">
					<div class="flex items-center gap-2">
						<Button
							type="button"
							size="sm"
							variant="outline"
							onclick={runEnabledProviderTests}
							disabled={providerTestsRunning}
							loading={providerTestsRunning}>
							{providerTestsRunning
								? $t('admin.site.testingProviders')
								: $t('admin.site.testProviders')}
						</Button>
					</div>
					<InfoText class="mt-2">{$t('admin.site.testProvidersHint')}</InfoText>
				</div>

				<h4>{$t('admin.site.textSection')}</h4>
				<InfoText>{$t('admin.site.textHint')}</InfoText>
				<Dropdown
					name="llmProvider"
					options={availableProviderOptions}
					bind:selected={llmProvider}
					legend={$t('admin.site.provider')} />

				<ModelInput id="textModel" provider={llmProvider} type="chat" bind:value={textModel} />
				<h4>{$t('admin.site.imageOcr')}</h4>
				<InfoText>{$t('admin.site.imageOcrHint')}</InfoText>
				<div class="flex flex-col gap-2">
					<Dropdown
						name="imageProvider"
						options={availableProviderOptions}
						bind:selected={llmImageProvider}
						legend={$t('admin.site.provider')} />
					{#if supportsImages}
						<ModelInput
							id="imageModel"
							provider={llmImageProvider}
							type="image"
							bind:value={imageModel} />
					{:else}
						<InfoText>
							{llmImageProvider === 'ollama'
								? 'Ollama'
								: llmImageProvider || $t('common.thisProvider')}
							{$t('admin.site.noImageAnalysis')}
						</InfoText>
					{/if}
				</div>

				<h4>{$t('admin.site.imageGen')}</h4>
				<InfoText>{$t('admin.site.imageGenHint')}</InfoText>
				<div class="flex flex-col gap-2">
					<Dropdown
						name="imageGenerationProvider"
						options={availableProviderOptions}
						bind:selected={llmImageGenerationProvider}
						legend={$t('admin.site.provider')} />
					{#if supportsImageGeneration}
						<ModelInput
							id="imageGenerationModel"
							provider={llmImageGenerationProvider}
							type="imageGeneration"
							bind:value={imageGenerationModel} />
					{:else}
						<InfoText>
							{llmImageGenerationProvider === 'ollama'
								? 'Ollama'
								: llmImageGenerationProvider || $t('common.thisProvider')}
							{$t('admin.site.noImageGen')}
						</InfoText>
					{/if}
				</div>

				<h4>{$t('admin.site.embeddings')}</h4>
				<InfoText>{$t('admin.site.embeddingsHint')}</InfoText>
				<div class="flex flex-col gap-2">
					<Checkbox
						name="semanticEnabled"
						bind:checked={semanticEnabled}
						legend={$t('admin.site.enableEmbeddings')}
						size="sm"
						color="primary"
						disabled={!(llmConfig.semanticAvailableProviders || []).length}>
						{semanticEnabled
							? $t('admin.site.embeddingsEnabled')
							: $t('admin.site.embeddingsDisabled')}
					</Checkbox>
					{#if !(llmConfig.semanticAvailableProviders || []).length}
						<InfoText>{$t('admin.site.noEmbeddingProviders')}</InfoText>
					{/if}
					<Dropdown
						name="semanticEmbeddingProvider"
						options={semanticProviderOptions}
						bind:selected={semanticEmbeddingProvider}
						legend={$t('admin.site.provider')}
						disabled={!semanticEnabled} />
					{#if effectiveSemanticProvider}
						<ModelInput
							id="semanticEmbeddingModel"
							provider={effectiveSemanticProvider}
							type="embedding"
							placeholder={defaultSemanticModel
								? $t('admin.site.defaultModelPlaceholder', { model: defaultSemanticModel })
								: ''}
							disabled={!semanticEnabled || !semanticProviderConfigured}
							bind:value={semanticEmbeddingModel} />
						{#if semanticEnabled && embeddingModelChanged && indexedRecipeCount > 0}
							<FeedbackMessage
								inline
								type="warning"
								style="soft"
								messageCode="admin.site.embeddingModelChangeWarning"
								messageVars={{ count: indexedRecipeCount, model: indexedEmbeddingModel }} />
						{/if}
					{:else}
						<InfoText>{$t('admin.site.selectProviderFirst')}</InfoText>
					{/if}
					{#if semanticEmbeddingProvider && !semanticProviderConfigured}
						<InfoText>
							{#if semanticEmbeddingProvider === 'ollama'}
								{$t('admin.site.missingOllama')}
							{:else if semanticEmbeddingProvider === 'google'}
								{$t('admin.site.missingGoogle')}
							{:else if semanticEmbeddingProvider === 'openai_compatible'}
								{$t('admin.site.missingOpenaiCompatible')}
							{:else if semanticEmbeddingProvider === 'openai'}
								{$t('admin.site.missingOpenai')}
							{:else}
								{$t('admin.site.missingProviderConfig')}
							{/if}
						</InfoText>
					{/if}
					{#if semanticEnabled}
						<div class="rounded-box border border-base-300 bg-base-200 p-4 mt-2 space-y-2">
							<p class="text-sm">
								{$t('admin.site.indexed', {
									completed: embeddingIndex.completed,
									total: embeddingIndex.total
								})}
								({$t('admin.site.remainingInline', { count: embeddingIndex.remaining })})
							</p>
							<progress
								class="progress progress-info w-full"
								value={embeddingPercent}
								max="100"
								aria-label={$t('admin.site.embeddingProgressAria')}></progress>
							<p class="text-xs text-base-content/70">
								{embeddingPercent}{$t('admin.site.percentComplete')}
							</p>
							{#if (embeddingIndex.mismatched || 0) > 0}
								<p class="text-sm text-warning">
									{embeddingIndex.mismatched}
									{$t(
										embeddingIndex.mismatched === 1
											? 'admin.site.recipe_one'
											: 'admin.site.recipe_other'
									)}
									{$t('admin.site.mismatchedNote')}
								</p>
							{/if}
							<div class="flex flex-wrap gap-2">
								<Button
									type="button"
									class="self-start w-auto"
									onclick={() => generateEmbeddingBatch(false)}
									disabled={embeddingInProgress || !canGenerateEmbeddings}>
									{embeddingInProgress
										? $t('admin.site.generatingEmbeddings')
										: $t('admin.site.generateEmbeddings')}
								</Button>
								{#if (embeddingIndex.mismatched || 0) > 0}
									<Button
										type="button"
										class="self-start w-auto"
										onclick={() => generateEmbeddingBatch(true)}
										disabled={embeddingInProgress || !canRegenerateMismatched}>
										{$t('admin.site.regenerateMismatched')}
									</Button>
								{/if}
							</div>
							{#if embeddingBatchResult}
								<p class="text-sm">
									{$t('admin.site.processed')}
									{embeddingBatchResult.processed},
									{$t('admin.site.failed')}
									{embeddingBatchResult.failed},
									{$t('admin.site.remaining')}
									{embeddingBatchResult.remaining}
								</p>
							{/if}
							<FeedbackMessage message={embeddingFeedback} inline />
						</div>
					{/if}
				</div>
			{/if}

			<footer class="flex flex-col gap-2">
				<Button type="submit" class="self-start w-auto"
					>{$t('admin.site.updateLlmSettings')}</Button>
				<FeedbackMessage message={llmFeedback} messageCode={llmFeedbackCode} inline />
			</footer>
		</form>
	{/if}
</div>

<div class="w-full md:w-3/4 lg:w-2/3 space-y-2 mb-3">
	<h3>{$t('admin.site.passwordRequirements')}</h3>
	<div class="rounded-box border border-base-300 bg-base-200 p-4 mt-4 space-y-1">
		<p>
			<strong>{$t('admin.site.passwordSummary')}</strong>
			{passwordRequirementsDescription || $t('admin.site.passwordDefault')}
		</p>
		{#if passwordRequirements}
			<p><strong>{$t('admin.site.passwordMinLength')}</strong> {passwordRequirements.minLength}</p>
			<p>
				<strong>{$t('admin.site.passwordUppercase')}</strong>
				{passwordRequirements.requireUppercase ? $t('common.required') : $t('common.notRequired')}
			</p>
			<p>
				<strong>{$t('admin.site.passwordLowercase')}</strong>
				{passwordRequirements.requireLowercase ? $t('common.required') : $t('common.notRequired')}
			</p>
			<p>
				<strong>{$t('admin.site.passwordDigits')}</strong>
				{passwordRequirements.requireDigit ? $t('common.required') : $t('common.notRequired')}
			</p>
			<p>
				<strong>{$t('admin.site.passwordSpecial')}</strong>
				{passwordRequirements.requireSpecial ? $t('common.required') : $t('common.notRequired')}
			</p>
		{/if}
		<InfoText class="my-4">{$t('admin.site.passwordEnvNote')}</InfoText>
	</div>
</div>

<div class="w-full md:w-3/4 lg:w-2/3 space-y-4 mb-3">
	<h3>{$t('admin.site.databaseBackups')}</h3>
	{#if backupError}
		<FeedbackMessage message={backupError} messageCode={backupErrorCode} inline type="error" />
	{:else if backupInfo}
		<div class="backup-config rounded-box border border-base-300 bg-base-200 p-4 space-y-2">
			<p><strong>{$t('admin.site.backupSchedule')}</strong> {backupInfo.cronPlainEnglish}</p>
			<p>
				<strong>{$t('admin.site.backupRetention')}</strong>
				{$t('admin.site.backupKeep')}
				{backupInfo.retentionCount}
				{$t('admin.site.backupMostRecent')}
			</p>
			<InfoText class="my-4">{$t('admin.site.backupEnvNote')}</InfoText>
		</div>
		<div class="backup-actions">
			<Button
				onclick={createManualBackup}
				disabled={backupInProgress}
				class="self-start w-auto"
				loading={backupInProgress}>
				{backupInProgress ? $t('admin.site.creatingBackup') : $t('admin.site.backupNow')}
			</Button>
			<FeedbackMessage message={backupFeedback} messageCode={backupFeedbackCode} inline />
		</div>

		{#if backupInfo.backups.length > 0}
			<h4>{$t('admin.site.availableBackups')} ({backupInfo.backups.length})</h4>
			<Table zebra size="sm" bordered>
				<TableHead>
					<TableRow>
						<TableCell tag="th">{$t('admin.site.backupType')}</TableCell>
						<TableCell tag="th">{$t('admin.site.backupCreated')}</TableCell>
						<TableCell tag="th" class="hidden sm:table-cell"
							>{$t('admin.site.backupSize')}</TableCell>
						<TableCell tag="th" class="hidden sm:table-cell"
							>{$t('admin.site.backupFilename')}</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{#each backupInfo.backups as backup}
						<TableRow>
							<TableCell>
								<Badge variant={backup.type}>
									{#if backup.type === 'pre-migration'}
										{$t('admin.site.backupTypeMigration')}
									{:else if backup.type === 'manual'}
										{$t('admin.site.backupTypeManual')}
									{:else}
										{$t('admin.site.backupTypeScheduled')}
									{/if}
								</Badge>
							</TableCell>
							<TableCell>{localDateAndTime(backup.timestamp)}</TableCell>
							<TableCell class="hidden sm:table-cell">{backup.size}</TableCell>
							<TableCell class="filename hidden sm:table-cell">{backup.name}</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		{:else}
			<p>{$t('admin.site.noBackups')}</p>
		{/if}
	{:else}
		<p>{$t('admin.site.loadingBackups')}</p>
	{/if}
</div>

<Dialog bind:isOpen={providerTestDialogOpen} onClose={() => (providerTestDialogOpen = false)}>
	<h3 class="font-bold text-lg mb-4">{$t('admin.site.enabledProviderChecks')}</h3>
	<InfoText class="mb-3">{$t('admin.site.providerTestWarning')}</InfoText>
	{#if providerTestResults.length === 0}
		<InfoText>{$t('admin.site.noProvidersToTest')}</InfoText>
	{:else}
		<div class="flex flex-col gap-2">
			{#each providerTestResults as result}
				<div class="rounded-box border border-base-300 p-3 flex flex-col gap-1">
					<div class="flex items-center gap-2">
						<span class="font-semibold">{result.label}</span>
						<span class="text-sm opacity-70">({result.provider})</span>
						{#if result.status === 'pending'}
							<Badge color="warning" size="sm">{$t('admin.site.statusPending')}</Badge>
						{:else if result.status === 'success'}
							<Badge color="success" size="sm">{$t('admin.site.statusConnected')}</Badge>
						{:else}
							<Badge color="error" size="sm">{$t('admin.site.statusFailed')}</Badge>
						{/if}
					</div>
					<p class="text-sm opacity-80">
						{$t('admin.site.testType')}
						{result.type}{result.model ? `, ${$t('admin.site.testModel')} ${result.model}` : ''}
					</p>
					{#if result.status === 'success' && result.latencyMs !== null}
						<p class="text-sm text-success">{$t('admin.site.testLatency')} {result.latencyMs}ms</p>
					{:else if result.status === 'error'}
						<p class="text-sm text-error">
							{result.error ||
								(result.errorCode ? $t(result.errorCode) : $t('admin.site.connectionFailed'))}
						</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
	<div class="modal-action">
		<Button
			type="button"
			style="outline"
			color="secondary"
			onclick={() => (providerTestDialogOpen = false)}>
			{$t('common.close')}
		</Button>
		<Button
			type="button"
			onclick={runEnabledProviderTests}
			disabled={providerTestsRunning}
			loading={providerTestsRunning}>
			{providerTestsRunning ? $t('admin.site.testing') : $t('admin.site.rerunTests')}
		</Button>
	</div>
</Dialog>

<style lang="scss">
	footer {
		margin-top: 1rem;
	}

	.backup-actions {
		margin-top: 0.75rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--pico-muted-border-color);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	:global(.filename) {
		font-family: monospace;
		font-size: 0.9em;
		word-break: break-all;
	}
</style>
