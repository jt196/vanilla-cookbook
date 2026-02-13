<script>
	import { localDateAndTime } from '$lib/utils/dateTime'
	import { invalidateAll } from '$app/navigation'
	import {
		getProviderOptionsWithAvailability,
		getTextModelsForProvider,
		getImageModelsForProvider
	} from '$lib/utils/llmModels.js'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Badge from '$lib/components/ui/Badge.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Dropdown from '$lib/components/ui/Form/Dropdown.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Table from '$lib/components/ui/Table/Table.svelte'
	import TableHead from '$lib/components/ui/Table/TableHead.svelte'
	import TableBody from '$lib/components/ui/Table/TableBody.svelte'
	import TableRow from '$lib/components/ui/Table/TableRow.svelte'
	import TableCell from '$lib/components/ui/Table/TableCell.svelte'
	import InfoText from '$lib/components/ui/InfoText.svelte'

	/** @type {{data: any}} */
	let { data } = $props()

	const { settings, llmConfig, passwordRequirements, passwordRequirementsDescription, oauth } =
		$state(data)

	let oidcEnabled = $derived(oauth?.oidcEnabled ?? false)

	let settingsFeedback = $state('')
	let llmFeedback = $state('')
	let backupInfo = $state(data.backupInfo)
	let backupError = $state(data.backupError || '')
	let backupInProgress = $state(false)
	let backupFeedback = $state('')
	let embeddingInProgress = $state(false)
	let embeddingFeedback = $state('')
	let embeddingBatchResult = $state(null)
	let embeddingIndex = $state(data.embeddingIndex || { total: 0, remaining: 0, completed: 0 })
	let embeddingPercent = $derived(
		embeddingIndex.total > 0
			? Math.round((Math.max(embeddingIndex.completed, 0) / embeddingIndex.total) * 100)
			: 0
	)

	// LLM form state
	let llmEnabled = $state(llmConfig.dbEnabled)
	let semanticEnabled = $state(llmConfig.dbSemanticEnabled ?? false)
	let semanticEmbeddingProvider = $state(
		llmConfig.dbSemanticEmbeddingProvider || llmConfig.semanticSelectedProvider || ''
	)
	let semanticEmbeddingModel = $state(
		llmConfig.dbSemanticEmbeddingModel || llmConfig.semanticModel || ''
	)
	const initialProvider = llmConfig.dbProvider || llmConfig.availableProviders[0] || ''
	let llmProvider = $state(initialProvider)

	// Check if current model is in the list or custom
	function getModelSelection(currentModel, provider, isImage = false) {
		const modelList = isImage
			? getImageModelsForProvider(provider)
			: getTextModelsForProvider(provider)
		if (!currentModel) return modelList[0]?.value || ''
		const found = modelList.find((m) => m.value === currentModel)
		return found ? currentModel : 'custom'
	}

	// Compute initial selections based on DB values and initial provider
	const initialTextSelection = getModelSelection(llmConfig.dbTextModel, initialProvider, false)
	const initialImageSelection = getModelSelection(llmConfig.dbImageModel, initialProvider, true)

	let textModelSelection = $state(initialTextSelection)
	let imageModelSelection = $state(initialImageSelection)
	let customTextModel = $state(initialTextSelection === 'custom' ? llmConfig.dbTextModel || '' : '')
	let customImageModel = $state(
		initialImageSelection === 'custom' ? llmConfig.dbImageModel || '' : ''
	)

	let textModelList = $derived(getTextModelsForProvider(llmProvider))
	let imageModelList = $derived(getImageModelsForProvider(llmProvider))

	// Track provider changes to reset model selections
	let previousProvider = initialProvider
	$effect(() => {
		if (llmProvider !== previousProvider) {
			previousProvider = llmProvider
			const newTextModels = getTextModelsForProvider(llmProvider)
			const newImageModels = getImageModelsForProvider(llmProvider)
			textModelSelection = newTextModels[0]?.value || ''
			imageModelSelection = newImageModels[0]?.value || ''
			customTextModel = ''
			customImageModel = ''
		}
	})

	let showCustomTextInput = $derived(textModelSelection === 'custom')
	let showCustomImageInput = $derived(imageModelSelection === 'custom')
	let supportsImages = $derived(imageModelList.length > 0)
	const semanticProviderCatalog = [
		{ value: 'openai', label: 'OpenAI', envVar: 'OPENAI_API_KEY' },
		{ value: 'ollama', label: 'Ollama (Local)', envVar: 'OLLAMA_BASE_URL' }
	]
	let semanticProviderOptions = $derived.by(() => {
		const available = new Set(llmConfig.semanticAvailableProviders || [])
		return semanticProviderCatalog.map((provider) => ({
			value: provider.value,
			label: available.has(provider.value) ? provider.label : `${provider.label} (Missing API key)`
		}))
	})
	let effectiveSemanticProvider = $derived(
		semanticEmbeddingProvider || llmConfig.semanticProvider || null
	)
	let semanticProviderConfigured = $derived(
		!!effectiveSemanticProvider &&
			(llmConfig.semanticAvailableProviders || []).includes(effectiveSemanticProvider)
	)
	let semanticModelOptions = $derived.by(() => {
		if (effectiveSemanticProvider === 'openai') {
			return [
				{ value: 'text-embedding-3-small', label: 'text-embedding-3-small (Recommended)' },
				{ value: 'text-embedding-3-large', label: 'text-embedding-3-large' },
				{ value: 'text-embedding-ada-002', label: 'text-embedding-ada-002 (Legacy)' }
			]
		}
		if (effectiveSemanticProvider === 'ollama') {
			return [
				{ value: 'nomic-embed-text', label: 'nomic-embed-text (Recommended)' },
				{ value: 'mxbai-embed-large', label: 'mxbai-embed-large' },
				{ value: 'all-minilm', label: 'all-minilm' }
			]
		}
		return []
	})
	$effect(() => {
		if (!semanticEmbeddingModel && semanticModelOptions.length > 0) {
			semanticEmbeddingModel = semanticModelOptions[0].value
		}
	})
	let canGenerateEmbeddings = $derived(
		semanticEnabled &&
			llmConfig.semanticEnabledByEnv &&
			semanticProviderConfigured &&
			!!effectiveSemanticProvider
	)

	// Get the actual model value to save
	let effectiveTextModel = $derived(
		textModelSelection === 'custom' ? customTextModel : textModelSelection
	)
	let effectiveImageModel = $derived(
		imageModelSelection === 'custom' ? customImageModel : imageModelSelection
	)

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
			settingsFeedback = 'Settings updated successfully!'
		} else {
			settingsFeedback = 'There was a problem updating your settings!'
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
				llmTextModel: effectiveTextModel || null,
				llmImageModel: supportsImages ? effectiveImageModel || null : null,
				semanticEmbeddingProvider: semanticEmbeddingProvider || null,
				semanticEmbeddingModel: semanticEmbeddingModel || null
			})
		})
		if (response.ok) {
			llmFeedback = 'LLM settings updated successfully!'
			await invalidateAll()
		} else {
			llmFeedback = 'There was a problem updating LLM settings!'
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
				backupFeedback = result.message
				// Refresh the data from server
				await invalidateAll()
			} else {
				const error = await response.json()
				backupFeedback = error.error || 'Failed to create backup'
			}
		} catch (error) {
			backupFeedback = 'Error creating backup: ' + error.message
		} finally {
			backupInProgress = false
		}
	}

	async function generateEmbeddingBatch() {
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
					body: JSON.stringify({ batchSize: 25 })
				})
				const data = await response.json().catch(() => ({}))
				if (!response.ok) {
					embeddingFeedback = data.error || data.reason || 'Failed to generate embeddings.'
					return
				}

				processedTotal += data.processed || 0
				failedTotal += data.failed || 0
				embeddingBatchResult = data
				embeddingIndex = {
					total: embeddingIndex.total,
					remaining: data.remaining ?? embeddingIndex.remaining,
					completed: Math.max((embeddingIndex.total || 0) - (data.remaining || 0), 0)
				}

				if (data.remaining === 0) break
				if ((data.processed || 0) === 0 && (data.failed || 0) === 0) break
			}

			embeddingFeedback = `Embedding run complete: ${processedTotal} processed, ${failedTotal} failed, ${embeddingIndex.remaining} remaining.`
		} catch (error) {
			embeddingFeedback = `Error generating embeddings: ${error.message}`
		} finally {
			embeddingInProgress = false
		}
	}

	// Update backupInfo when data changes
	$effect(() => {
		backupInfo = data.backupInfo
		backupError = data.backupError || ''
		embeddingIndex = data.embeddingIndex || { total: 0, remaining: 0, completed: 0 }
	})
</script>

<h3>Update Site Settings</h3>
<div class="w-full md:w-3/4 lg:w-2/3 space-y-4 mb-3">
	<form
		method="POST"
		action="?/updateAdminSettings"
		onsubmit={updateAdminSettings}
		class="flex flex-col gap-3">
		<Checkbox
			name="registrationAllowed"
			bind:checked={settings.registrationAllowed}
			legend="Allow Registrations"
			size="sm"
			color="primary">
			Turn on site registration</Checkbox>
		<Checkbox
			name="requireLogin"
			bind:checked={settings.requireLogin}
			legend="Require Login"
			size="sm"
			color="primary">
			Require authentication for all pages (private site mode)</Checkbox>
		<InfoText>
			When enabled, all visitors must log in to access any page. Public recipes and profiles will
			still be hidden from unauthenticated users.
		</InfoText>
		{#if oidcEnabled}
			<Checkbox
				name="oidcAutoProvision"
				bind:checked={settings.oidcAutoProvision}
				legend="OIDC Auto-Provisioning"
				size="sm"
				color="primary">
				Automatically create accounts for new OIDC users</Checkbox>
			<InfoText>
				When enabled, users signing in via OIDC for the first time will have an account created
				automatically. When disabled, only existing users can sign in via OIDC.
			</InfoText>
		{/if}
		<footer class="flex flex-col gap-2">
			<Button type="submit" class="self-start w-auto">Update</Button>
			<FeedbackMessage message={settingsFeedback} inline />
		</footer>
	</form>
</div>

<div class="w-full md:w-3/4 lg:w-2/3 space-y-2 mb-3">
	<h3>LLM Configuration</h3>
	{#if !llmConfig.hasAnyApiKey}
		<div class="rounded-box border border-base-300 bg-base-200 p-4">
			<InfoText>
				No API keys configured. Add API keys to your .env file to enable LLM features:
				<code>OPENAI_API_KEY</code>, <code>ANTHROPIC_API_KEY</code>, <code>GOOGLE_API_KEY</code>, or
				configure <code>OLLAMA_BASE_URL</code> for local models.
			</InfoText>
		</div>
	{:else}
		<form onsubmit={updateLlmSettings} class="flex flex-col gap-4">
			<Checkbox
				name="llmEnabled"
				bind:checked={llmEnabled}
				legend="Enable LLM Features"
				size="sm"
				color="primary">
				Enable AI-assisted recipe parsing and image analysis
			</Checkbox>

			<Checkbox
				name="semanticEnabled"
				bind:checked={semanticEnabled}
				legend="Enable Semantic Search"
				size="sm"
				color="primary"
				disabled={!llmConfig.semanticEnabledByEnv || !llmConfig.semanticProviderAvailable}>
				Enable embedding-based recipe search
			</Checkbox>

			{#if !llmConfig.semanticEnabledByEnv}
				<InfoText>
					Set <code>SEMANTIC_SEARCH_ENABLED=true</code> in your <code>.env</code> file to enable this
					feature.
				</InfoText>
			{:else if !(llmConfig.semanticAvailableProviders || []).length}
				<InfoText>
					No embedding providers configured. Add <code>OPENAI_API_KEY</code> and/or
					<code>OLLAMA_BASE_URL</code> in <code>.env</code>.
				</InfoText>
			{/if}

			{#if semanticEnabled}
				<div class="rounded-box border border-base-300 bg-base-200 p-4 space-y-2">
					<p class="font-semibold">Semantic Embedding Index</p>
					<InfoText>Generate embeddings for recipes missing vectors.</InfoText>
					<InfoText>
						Batches run from this page. If you navigate away, processing pauses after the current
						batch and can be resumed later.
					</InfoText>
					{#if semanticEmbeddingProvider && !semanticProviderConfigured}
						<InfoText>
							Selected embedding provider is not configured in <code>.env</code>.
						</InfoText>
					{/if}
					<p class="text-sm">
						Indexed: {embeddingIndex.completed} / {embeddingIndex.total} ({embeddingIndex.remaining}
						remaining)
					</p>
					<progress
						class="progress progress-info w-full"
						value={embeddingPercent}
						max="100"
						aria-label="Embedding generation progress"></progress>
					<p class="text-xs text-base-content/70">{embeddingPercent}% complete</p>
					<Button
						type="button"
						class="self-start w-auto"
						onclick={generateEmbeddingBatch}
						disabled={embeddingInProgress || !canGenerateEmbeddings}>
						{embeddingInProgress ? 'Generating Embeddings...' : 'Generate Embeddings'}
					</Button>
					{#if embeddingBatchResult}
						<p class="text-sm">
							Processed: {embeddingBatchResult.processed}, Failed: {embeddingBatchResult.failed},
							Remaining: {embeddingBatchResult.remaining}
						</p>
					{/if}
					<FeedbackMessage message={embeddingFeedback} inline />
				</div>
			{/if}

			{#if llmEnabled}
				<Dropdown
					name="llmProvider"
					options={availableProviderOptions}
					bind:selected={llmProvider}
					legend="Text/Image Provider" />

				<div class="flex flex-col gap-2">
					<Dropdown
						name="textModel"
						options={textModelList}
						bind:selected={textModelSelection}
						legend="Text Model (for recipe parsing)" />
					{#if showCustomTextInput}
						<Input
							type="text"
							id="customTextModel"
							label="Custom Text Model"
							placeholder="e.g. gpt-4o-2024-08-06"
							bind:value={customTextModel} />
					{/if}
				</div>
				{#if supportsImages}
					<div class="flex flex-col gap-2">
						<Dropdown
							name="imageModel"
							options={imageModelList}
							bind:selected={imageModelSelection}
							legend="Image Model (for image analysis)" />
						{#if showCustomImageInput}
							<Input
								type="text"
								id="customImageModel"
								label="Custom Image Model"
								placeholder="e.g. claude-3-5-sonnet-20241022"
								bind:value={customImageModel} />
						{/if}
					</div>
				{:else}
					<InfoText>
						{llmProvider === 'ollama' ? 'Ollama' : 'This provider'} does not support image analysis.
					</InfoText>
				{/if}

				<div class="mt-2 border-t border-base-300 pt-3 flex flex-col gap-2">
					<Dropdown
						name="semanticEmbeddingProvider"
						options={semanticProviderOptions}
						bind:selected={semanticEmbeddingProvider}
						legend="Embedding Provider" />
					{#if semanticModelOptions.length > 0}
						<Dropdown
							name="semanticEmbeddingModel"
							options={semanticModelOptions}
							bind:selected={semanticEmbeddingModel}
							legend="Embedding Model"
							disabled={!semanticProviderConfigured} />
					{:else}
						<InfoText>Select an embedding provider to choose a model.</InfoText>
					{/if}
				</div>
			{/if}

			<footer class="flex flex-col gap-2">
				<Button type="submit" class="self-start w-auto">Update LLM Settings</Button>
				<FeedbackMessage message={llmFeedback} inline />
			</footer>
		</form>
	{/if}
</div>

<div class="w-full md:w-3/4 lg:w-2/3 space-y-2 mb-3">
	<h3>Password Requirements</h3>
	<div class="rounded-box border border-base-300 bg-base-200 p-4 space-y-1">
		<p>
			<strong>Summary:</strong>
			{passwordRequirementsDescription || 'Using default password requirements.'}
		</p>
		{#if passwordRequirements}
			<p><strong>Minimum Length:</strong> {passwordRequirements.minLength}</p>
			<p>
				<strong>Uppercase:</strong>
				{passwordRequirements.requireUppercase ? 'Required' : 'Not required'}
			</p>
			<p>
				<strong>Lowercase:</strong>
				{passwordRequirements.requireLowercase ? 'Required' : 'Not required'}
			</p>
			<p>
				<strong>Digits:</strong>
				{passwordRequirements.requireDigit ? 'Required' : 'Not required'}
			</p>
			<p>
				<strong>Special Characters:</strong>
				{passwordRequirements.requireSpecial ? 'Required' : 'Not required'}
			</p>
		{/if}
		<InfoText class="my-4">Update values in your .env file to change password rules.</InfoText>
	</div>
</div>

<div class="w-full md:w-3/4 lg:w-2/3 space-y-4 mb-3">
	<h3>Database Backups</h3>
	{#if backupError}
		<p class="error">{backupError}</p>
	{:else if backupInfo}
		<div class="backup-config rounded-box border border-base-300 bg-base-200 p-4 space-y-2">
			<p><strong>Schedule:</strong> {backupInfo.cronPlainEnglish}</p>
			<p>
				<strong>Retention:</strong> Keep {backupInfo.retentionCount} most recent scheduled backups
			</p>
			<InfoText class="my-4">Please edit your .env file to change these</InfoText>
		</div>
		<div class="backup-actions">
			<Button
				onclick={createManualBackup}
				disabled={backupInProgress}
				class="self-start w-auto"
				loading={backupInProgress}>
				{backupInProgress ? 'Creating Backup...' : 'Backup Now'}
			</Button>
			<FeedbackMessage message={backupFeedback} inline />
		</div>

		{#if backupInfo.backups.length > 0}
			<h4>Available Backups ({backupInfo.backups.length})</h4>
			<Table zebra size="sm" bordered>
				<TableHead>
					<TableRow>
						<TableCell tag="th">Type</TableCell>
						<TableCell tag="th">Created</TableCell>
						<TableCell tag="th" class="hidden sm:table-cell">Size</TableCell>
						<TableCell tag="th" class="hidden sm:table-cell">Filename</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{#each backupInfo.backups as backup}
						<TableRow>
							<TableCell>
								<Badge variant={backup.type}>
									{#if backup.type === 'pre-migration'}
										Migration
									{:else if backup.type === 'manual'}
										Manual
									{:else}
										Scheduled
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
			<p>No backups found.</p>
		{/if}
	{:else}
		<p>Loading backup information...</p>
	{/if}
</div>

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

	.error {
		color: var(--pico-del-color);
	}

	:global(.filename) {
		font-family: monospace;
		font-size: 0.9em;
		word-break: break-all;
	}
</style>
