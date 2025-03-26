<script>
	import { systems } from '$lib/utils/config'

	/** @type {{selectedSystem?: string, measurementSystem?: string}} */
	let {
		selectedSystem = '',
		measurementSystem = '',
		onSelectedSystemChange // callback to inform parent of a change
	} = $props()

	let summary = $state()

	function getLabelFromValue(value) {
		const system = systems.find((s) => s.value === value)
		return system ? system.label : null
	}

	$effect(() => {
		const originalLabel = getLabelFromValue(measurementSystem?.system)
		const selectedLabel = getLabelFromValue(selectedSystem)

		let newSummary = 'Loading...' // Temporary variable

		if (originalLabel) {
			newSummary = `${originalLabel} `
			if (selectedLabel && selectedSystem !== measurementSystem.system) {
				newSummary += ` to ${selectedLabel}`
			}
		}

		// Only update `summary` once, avoiding self-triggering `$effect`
		if (summary !== newSummary) {
			summary = newSummary
		}
	})

	// Handler for radio button change
	function handleRadioChange(event) {
		const value = event.target.value
		onSelectedSystemChange && onSelectedSystemChange(value)
	}
</script>

<details class="dropdown">
	<summary>{summary}</summary>
	<ul>
		{#each systems as system}
			<li>
				<label>
					<input
						type="radio"
						name="system"
						value={system.value}
						checked={system.value === selectedSystem}
						onchange={handleRadioChange} />
					{system.label}
				</label>
			</li>
		{/each}
	</ul>
</details>

<style lang="scss">
	.dropdown {
		flex-grow: 1; /* Tells the dropdown to take up all available space */
		flex-shrink: 1; /* Allows the dropdown to shrink if necessary */
		flex-basis: auto; /* Default starting size before growing or shrinking */
		min-width: 0; /* Makes sure it respects its parent's size */
	}
</style>
