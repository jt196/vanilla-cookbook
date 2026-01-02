<script>
	import { localDateAndTime } from '$lib/utils/dateTime'
	import { invalidateAll } from '$app/navigation'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Badge from '$lib/components/ui/Badge.svelte'
	import Container from '$lib/components/ui/Container.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Table from '$lib/components/ui/Table/Table.svelte'
	import TableHead from '$lib/components/ui/Table/TableHead.svelte'
	import TableBody from '$lib/components/ui/Table/TableBody.svelte'
	import TableRow from '$lib/components/ui/Table/TableRow.svelte'
	import TableCell from '$lib/components/ui/Table/TableCell.svelte'

	/** @type {{data: any}} */
	let { data } = $props()

	const { settings, llmConfig } = $state(data)

	let settingsFeedback = $state('')
	let backupInfo = $state(data.backupInfo)
	let backupError = $state(data.backupError || '')
	let backupInProgress = $state(false)
	let backupFeedback = $state('')
	let llm = $state(llmConfig)

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

	// Update backupInfo when data changes
	$effect(() => {
		backupInfo = data.backupInfo
		backupError = data.backupError || ''
		llm = data.llmConfig
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
			name="Admin"
			bind:checked={settings.registrationAllowed}
			legend="Allow Registrations"
			size="sm"
			color="primary">
			Turn on site registration</Checkbox>
		<footer class="flex flex-col gap-2">
			<Button type="submit" class="self-start w-auto">Update</Button>
			<FeedbackMessage message={settingsFeedback} inline />
		</footer>
	</form>
</div>

<div class="w-full md:w-3/4 lg:w-2/3 space-y-2 mb-3">
	<h3>LLM Configuration</h3>
	<div class="rounded-box border border-base-300 bg-base-200 p-4 space-y-1">
		<p>
			<strong>LLM API Enabled:</strong>
			{llm?.enabled ? 'Yes' : 'No'}
		</p>
		<p>
			<strong>Text Model:</strong>
			{llm?.textProvider} / {llm?.textModel}
		</p>
		<p>
			<strong>Image Model:</strong>
			{llm?.imageProvider} / {llm?.imageModel}
		</p>
		<p class="text-xs">Update values in your .env file to change providers or models.</p>
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
			<p class="text-xs">Please edit your .env file to change these</p>
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
