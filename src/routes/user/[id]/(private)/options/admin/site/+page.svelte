<script>
	import { localDateAndTime } from '$lib/utils/dateTime'
	import { invalidateAll } from '$app/navigation'
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
	let { data } = $props();

	const { settings } = $state(data)

	let settingsFeedback = $state('')
	let backupInfo = $state(data.backupInfo)
	let backupError = $state(data.backupError || '')
	let backupInProgress = $state(false)
	let backupFeedback = $state('')

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
	})
</script>

<h3>Update Site Settings</h3>
<Container>
	<form method="POST" action="?/updateAdminSettings" onsubmit={updateAdminSettings}>
		<Checkbox name="Admin" bind:checked={settings.registrationAllowed} label="Allow Registrations" />
		<footer>
			<Button type="submit">Update</Button>
			{#if settingsFeedback}
				<p class="feedback">{settingsFeedback}</p>
			{/if}
		</footer>
	</form>
</Container>

<h3>Database Backups</h3>
<Container>
	{#if backupError}
		<p class="error">{backupError}</p>
	{:else if backupInfo}
		<div class="backup-config">
			<p><strong>Schedule:</strong> {backupInfo.cronPlainEnglish}</p>
			<p><strong>Retention:</strong> Keep {backupInfo.retentionCount} most recent scheduled backups</p>
			<div class="backup-actions">
				<Button onclick={createManualBackup} disabled={backupInProgress} loading={backupInProgress}>
					{backupInProgress ? 'Creating Backup...' : 'Backup Now'}
				</Button>
				{#if backupFeedback}
					<p class="feedback">{backupFeedback}</p>
				{/if}
			</div>
		</div>

		{#if backupInfo.backups.length > 0}
			<h4>Available Backups ({backupInfo.backups.length})</h4>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell tag="th">Type</TableCell>
						<TableCell tag="th">Created</TableCell>
						<TableCell tag="th">Size</TableCell>
						<TableCell tag="th">Filename</TableCell>
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
							<TableCell>{backup.size}</TableCell>
							<TableCell class="filename">{backup.name}</TableCell>
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
</Container>

<style lang="scss">
	footer {
		margin-top: 1rem;
	}

	.backup-config {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background-color: var(--pico-background-color);
		border-radius: var(--pico-border-radius);

		p {
			margin: 0.5rem 0;
		}

		.backup-actions {
			margin-top: 1rem;
			padding-top: 1rem;
			border-top: 1px solid var(--pico-muted-border-color);

			button {
				margin-bottom: 0.5rem;
			}

			.feedback {
				margin-top: 0.5rem;
				font-size: 0.9em;
			}
		}
	}

	.error {
		color: var(--pico-del-color);
	}

	.filename {
		font-family: monospace;
		font-size: 0.9em;
		word-break: break-all;
	}
</style>
