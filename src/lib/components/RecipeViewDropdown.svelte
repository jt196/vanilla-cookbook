<script>
	import { systems } from '$lib/utils/units'

	export let selectedSystem = ''
	export let measurementSystem = ''

	let summary

	function getLabelFromValue(value) {
		const system = systems.find((s) => s.value === value)
		return system ? system.label : null
	}

	$: {
		const originalLabel = getLabelFromValue(measurementSystem?.system)
		const selectedLabel = getLabelFromValue(selectedSystem)

		if (originalLabel) {
			summary = `${originalLabel} (original)`
			if (selectedLabel && selectedSystem !== measurementSystem.system) {
				summary += ` to ${selectedLabel}`
			}
		} else {
			summary = 'Loading...'
		}
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
						bind:group={selectedSystem}
						name="system"
						value={system.value}
						checked={system.value === selectedSystem} />
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
