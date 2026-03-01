<script>
	import { localDateAndTime } from '$lib/utils/dateTime'
	import { invalidateAll } from '$app/navigation'
	import {
		getProviderOptionsWithAvailability,
		getEmbeddingProviderOptionsWithAvailability,
		getEmbeddingModelsForProvider,
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

	// Connection test state
	let textTestResult = $state(null)
	let textTesting = $state(false)
	let imageTestResult = $state(null)
	let imageTesting = $state(false)
	let embeddingTestResult = $state(null)
	let embeddingTesting = $state(false)

	// LLM form state
	let llmEnabled = $state(llmConfig.dbEnabled)
	let semanticEnabled = $state(llmConfig.dbSemanticEnabled ?? false)
	let semanticEmbeddingProvider = $state(
		llmConfig.dbSemanticEmbeddingProvider || llmConfig.semanticSelectedProvider || ''
	)
	let semanticEmbeddingModel = $state(
		llmConfig.dbSemanticEmbeddingModel || llmConfig.semanticModel || ''
	)
	const initialTextProvider = llmConfig.dbProvider || llmConfig.availableProviders[0] || ''
	const initialImageProvider =
		llmConfig.dbImageProvider || llmConfig.imageProvider || initialTextProvider
	let llmProvider = $state(initialTextProvider)
	let llmImageProvider = $state(initialImageProvider)

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
	const initialTextSelection = getModelSelection(llmConfig.dbTextModel, initialTextProvider, false)
	const initialImageSelection = getModelSelection(
		llmConfig.dbImageModel,
		initialImageProvider,
		true
	)

	let textModelSelection = $state(initialTextSelection)
	let imageModelSelection = $state(initialImageSelection)
	let customTextModel = $state(initialTextSelection === 'custom' ? llmConfig.dbTextModel || '' : '')
	let customImageModel = $state(
		initialImageSelection === 'custom' ? llmConfig.dbImageModel || '' : ''
	)

	let textModelList = $derived(getTextModelsForProvider(llmProvider))
	let imageModelList = $derived(getImageModelsForProvider(llmImageProvider))

	// Track provider changes to reset model selections
	let previousProvider = initialTextProvider
	let previousImageProvider = initialImageProvider
	$effect(() => {
		if (llmProvider !== previousProvider) {
			previousProvider = llmProvider
			const newTextModels = getTextModelsForProvider(llmProvider)
			textModelSelection = newTextModels[0]?.value || ''
			customTextModel = ''
		}
	})
	$effect(() => {
		if (llmImageProvider !== previousImageProvider) {
			previousImageProvider = llmImageProvider
			const newImageModels = getImageModelsForProvider(llmImageProvider)
			imageModelSelection = newImageModels[0]?.value || ''
			customImageModel = ''
		}
	})

	let showCustomTextInput = $derived(textModelSelection === 'custom')
	let showCustomImageInput = $derived(imageModelSelection === 'custom')
	let supportsImages = $derived(imageModelList.length > 0)
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
	let semanticModelOptions = $derived(getEmbeddingModelsForProvider(effectiveSemanticProvider))
	$effect(() => {
		if (!semanticEmbeddingModel && semanticModelOptions.length > 0) {
			semanticEmbeddingModel = semanticModelOptions[0].value
		}
	})
	let canGenerateEmbeddings = $derived(
		semanticEnabled &&
			semanticProviderConfigured &&
			!!effectiveSemanticProvider &&
			embeddingIndex.remaining > 0
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
			const error = await response.json().catch(() => ({}))
			settingsFeedback =
				error.error || error.message || 'There was a problem updating your settings!'
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
			const error = await response.json().catch(() => ({}))
			llmFeedback = error.error || error.message || 'There was a problem updating LLM settings!'
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

	async function testConnection(provider, model, type) {
		try {
			const response = await fetch('/api/llm/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ provider, model, type })
			})
			return await response.json()
		} catch (err) {
			return { ok: false, error: err.message || 'Connection failed' }
		}
	}

	async function testTextConnection() {
		textTesting = true
		textTestResult = null
		const model = effectiveTextModel || undefined
		textTestResult = await testConnection(llmProvider, model, 'chat')
		textTesting = false
	}

	async function testImageConnection() {
		imageTesting = true
		imageTestResult = null
		const model = effectiveImageModel || undefined
		imageTestResult = await testConnection(llmImageProvider, model, 'chat')
		imageTesting = false
	}

	async function testEmbeddingConnection() {
		embeddingTesting = true
		embeddingTestResult = null
		const model = semanticEmbeddingModel || undefined
		embeddingTestResult = await testConnection(effectiveSemanticProvider, model, 'embedding')
		embeddingTesting = false
	}
</script>

<h3>Update Site Settings</h3>
<div class="w-full md:w-3/4 lg:w-2/3 space-y-4 mb-3">
	<form
		method="POST"
		action="?/updateAdminSettings"
		onsubmit={updateAdminSettings}
		class="flex flex-col gap-3"
	>
		<Checkbox
			name="registrationAllowed"
			bind:checked={settings.registrationAllowed}
			legend="Allow Registrations"
			size="sm"
			color="primary"
		>
			{settings.registrationAllowed
				? 'User registration is enabled.'
				: 'User registration is disabled.'}</Checkbox
		>
		<Checkbox
			name="requireLogin"
			bind:checked={settings.requireLogin}
			legend="Require Login"
			size="sm"
			color="primary"
		>
			{settings.requireLogin
				? 'Authentication is required for all pages (private site mode).'
				: 'Public pages are accessible without login.'}</Checkbox
		>
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
				color="primary"
			>
				{settings.oidcAutoProvision
					? 'Automatically create accounts for new OIDC users.'
					: 'Only existing accounts can sign in via OIDC.'}</Checkbox
			>
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
				color="primary"
			>
				{llmEnabled
					? 'AI-assisted recipe parsing and image analysis are enabled.'
					: 'AI-assisted recipe parsing and image analysis are disabled.'}
			</Checkbox>

			{#if llmEnabled}
				<h4>Text</h4>
				<InfoText
					>Used for recipe fallback parsing/translation/generation, ingredient cleanup, and
					direction summarising.</InfoText
				>
				<Dropdown
					name="llmProvider"
					options={availableProviderOptions}
					bind:selected={llmProvider}
					legend="Provider"
				/>

				<div class="flex flex-col gap-2">
					<Dropdown
						name="textModel"
						options={textModelList}
						bind:selected={textModelSelection}
						legend="Model"
					/>
					{#if showCustomTextInput}
						<Input
							type="text"
							id="customTextModel"
							label="Custom Model"
							placeholder="e.g. gpt-4o-2024-08-06"
							bind:value={customTextModel}
						/>
					{/if}
					<div class="flex items-center gap-2">
						<Button
							type="button"
							size="sm"
							variant="outline"
							onclick={testTextConnection}
							disabled={textTesting || !llmProvider}
							loading={textTesting}
						>
							{textTesting ? 'Testing...' : 'Test Connection'}
						</Button>
						{#if textTestResult}
							<span class={textTestResult.ok ? 'text-success' : 'text-error'}>
								{textTestResult.ok
									? `Connected (${textTestResult.latencyMs}ms)`
									: textTestResult.error}
							</span>
						{/if}
					</div>
				</div>
				<h4>Image</h4>
				<InfoText>Used for recipe extraction from uploaded images.</InfoText>
				<div class="flex flex-col gap-2">
					<Dropdown
						name="imageProvider"
						options={availableProviderOptions}
						bind:selected={llmImageProvider}
						legend="Provider"
					/>
					{#if supportsImages}
						<Dropdown
							name="imageModel"
							options={imageModelList}
							bind:selected={imageModelSelection}
							legend="Model"
						/>
						{#if showCustomImageInput}
							<Input
								type="text"
								id="customImageModel"
								label="Custom Model"
								placeholder="e.g. claude-3-5-sonnet-20241022"
								bind:value={customImageModel}
							/>
						{/if}
						<div class="flex items-center gap-2">
							<Button
								type="button"
								size="sm"
								variant="outline"
								onclick={testImageConnection}
								disabled={imageTesting || !llmImageProvider}
								loading={imageTesting}
							>
								{imageTesting ? 'Testing...' : 'Test Connection'}
							</Button>
							{#if imageTestResult}
								<span class={imageTestResult.ok ? 'text-success' : 'text-error'}>
									{imageTestResult.ok
										? `Connected (${imageTestResult.latencyMs}ms)`
										: imageTestResult.error}
								</span>
							{/if}
						</div>
					{:else}
						<InfoText>
							{llmImageProvider === 'ollama' ? 'Ollama' : llmImageProvider || 'This provider'} does not
							support image analysis.
						</InfoText>
					{/if}
				</div>

				<h4>Embeddings</h4>
				<InfoText>Powers semantic search, similar recipes, and other smart features.</InfoText>
				<div class="flex flex-col gap-2">
					<Checkbox
						name="semanticEnabled"
						bind:checked={semanticEnabled}
						legend="Enable Embeddings"
						size="sm"
						color="primary"
						disabled={!(llmConfig.semanticAvailableProviders || []).length}
					>
						{semanticEnabled ? 'Embeddings are enabled.' : 'Embeddings are disabled.'}
					</Checkbox>
					{#if !(llmConfig.semanticAvailableProviders || []).length}
						<InfoText>
							No embedding providers configured. Add <code>OPENAI_API_KEY</code>,
							<code>GOOGLE_API_KEY</code> and/or <code>OLLAMA_BASE_URL</code> in
							<code>.env</code>.
						</InfoText>
					{/if}
					<Dropdown
						name="semanticEmbeddingProvider"
						options={semanticProviderOptions}
						bind:selected={semanticEmbeddingProvider}
						legend="Provider"
						disabled={!semanticEnabled}
					/>
					{#if semanticModelOptions.length > 0}
						<Dropdown
							name="semanticEmbeddingModel"
							options={semanticModelOptions}
							bind:selected={semanticEmbeddingModel}
							legend="Model"
							disabled={!semanticEnabled || !semanticProviderConfigured}
						/>
					{:else}
						<InfoText>Select an embedding provider to choose a model.</InfoText>
					{/if}
					{#if semanticEmbeddingProvider && !semanticProviderConfigured}
						<InfoText>
							{#if semanticEmbeddingProvider === 'ollama'}
								Please add <code>OLLAMA_BASE_URL</code> to <code>.env</code>.
							{:else if semanticEmbeddingProvider === 'google'}
								Please add <code>GOOGLE_API_KEY</code> to <code>.env</code>.
							{:else if semanticEmbeddingProvider === 'openai'}
								Please add <code>OPENAI_API_KEY</code> to <code>.env</code>.
							{:else}
								Selected provider is missing configuration in <code>.env</code>.
							{/if}
						</InfoText>
					{/if}
					{#if semanticEnabled && semanticProviderConfigured}
						<div class="flex items-center gap-2">
							<Button
								type="button"
								size="sm"
								variant="outline"
								onclick={testEmbeddingConnection}
								disabled={embeddingTesting || !effectiveSemanticProvider}
								loading={embeddingTesting}
							>
								{embeddingTesting ? 'Testing...' : 'Test Connection'}
							</Button>
							{#if embeddingTestResult}
								<span class={embeddingTestResult.ok ? 'text-success' : 'text-error'}>
									{embeddingTestResult.ok
										? `Connected (${embeddingTestResult.latencyMs}ms)`
										: embeddingTestResult.error}
								</span>
							{/if}
						</div>
					{/if}
					{#if semanticEnabled}
						<div class="rounded-box border border-base-300 bg-base-200 p-4 mt-2 space-y-2">
							<p class="text-sm">
								Indexed: {embeddingIndex.completed} / {embeddingIndex.total} ({embeddingIndex.remaining}
								remaining)
							</p>
							<progress
								class="progress progress-info w-full"
								value={embeddingPercent}
								max="100"
								aria-label="Embedding generation progress"
							></progress>
							<p class="text-xs text-base-content/70">{embeddingPercent}% complete</p>
							<Button
								type="button"
								class="self-start w-auto"
								onclick={generateEmbeddingBatch}
								disabled={embeddingInProgress || !canGenerateEmbeddings}
							>
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
	<div class="rounded-box border border-base-300 bg-base-200 p-4 mt-4 space-y-1">
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
				loading={backupInProgress}
			>
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
