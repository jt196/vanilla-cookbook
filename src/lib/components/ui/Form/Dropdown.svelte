<script>
	import Radio from './Radio.svelte'

	let {
		/**
		 * @type {Array<{value: string, label: string}>}
		 */
		options = [],
		/**
		 * @type {string}
		 */
		name = '',
		/**
		 * @type {string}
		 */
		selected = $bindable(),
		/**
		 * @type {string}
		 */
		label = '',
		/**
		 * @type {(e: Event) => void}
		 */
		onchange = undefined,
		/**
		 * @type {string}
		 */
		class: className = ''
	} = $props()

	// Get the label for the currently selected value
	let selectedLabel = $derived(options.find((opt) => opt.value === selected)?.label || label)
</script>

<details class="dropdown {className}">
	<summary>{selectedLabel}</summary>
	<ul>
		{#each options as option}
			<li>
				<Radio
					{name}
					bind:group={selected}
					value={option.value}
					checked={option.value === selected}
					{onchange}
					label={option.label} />
			</li>
		{/each}
	</ul>
</details>
