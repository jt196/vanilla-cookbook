<script>
	import { localDateAndTime } from '$lib/utils/dateTime'
	import { invalidateAll } from '$app/navigation'

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
<div class="container">
	<form method="POST" action="?/updateAdminSettings" onsubmit={updateAdminSettings}>
		<label>
			<input type="checkbox" name="Admin" bind:checked={settings.registrationAllowed} />
			Allow Registrations
		</label>
		<footer>
			<button type="submit">Update</button>
			{#if settingsFeedback}
				<p class="feedback">{settingsFeedback}</p>
			{/if}
		</footer>
	</form>
</div>

<h3>Database Backups</h3>
<div class="container">
	{#if backupError}
		<p class="error">{backupError}</p>
	{:else if backupInfo}
		<div class="backup-config">
			<p><strong>Schedule:</strong> {backupInfo.cronPlainEnglish}</p>
			<p><strong>Retention:</strong> Keep {backupInfo.retentionCount} most recent scheduled backups</p>
			<div class="backup-actions">
				<button onclick={createManualBackup} disabled={backupInProgress} aria-busy={backupInProgress}>
					{backupInProgress ? 'Creating Backup...' : 'Backup Now'}
				</button>
				{#if backupFeedback}
					<p class="feedback">{backupFeedback}</p>
				{/if}
			</div>
		</div>

		{#if backupInfo.backups.length > 0}
			<h4>Available Backups ({backupInfo.backups.length})</h4>
			<table>
				<thead>
					<tr>
						<th>Type</th>
						<th>Created</th>
						<th>Size</th>
						<th>Filename</th>
					</tr>
				</thead>
				<tbody>
					{#each backupInfo.backups as backup}
						<tr>
							<td>
								<span class="badge {backup.type}">
									{#if backup.type === 'pre-migration'}
										Migration
									{:else if backup.type === 'manual'}
										Manual
									{:else}
										Scheduled
									{/if}
								</span>
							</td>
							<td>{localDateAndTime(backup.timestamp)}</td>
							<td>{backup.size}</td>
							<td class="filename">{backup.name}</td>
						</tr>
					{/each}
				</tbody>
			</table>
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

	table {
		width: 100%;
		margin-top: 1rem;
	}

	.filename {
		font-family: monospace;
		font-size: 0.9em;
		word-break: break-all;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.85em;
		font-weight: 500;

		&.scheduled {
			background-color: var(--pico-primary-background);
			color: var(--pico-primary-inverse);
		}

		&.pre-migration {
			background-color: var(--pico-secondary-background);
			color: var(--pico-secondary-inverse);
		}

		&.manual {
			background-color: var(--pico-contrast-background);
			color: var(--pico-contrast-inverse);
		}
	}
</style>
