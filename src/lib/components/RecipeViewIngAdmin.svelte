<script>
	/** @type {{displayDryMatch: any, displayOriginal: any}} */
	let {
		displayDryMatch = false,
		displayOriginal = false,
		onDisplayDryMatchChange,
		onDisplayOriginalChange
	} = $props()

	function handleDryMatchChange(e) {
		// Call the callback to update the parent's state.
		onDisplayDryMatchChange && onDisplayDryMatchChange(e.target.checked)
	}

	function handleOriginalChange(e) {
		onDisplayOriginalChange && onDisplayOriginalChange(e.target.checked)
	}
</script>

<fieldset data-tooltip="When converting from/to cups, display matched ingredients">
	<label>
		Display DryIng Match:
		<input
			type="checkbox"
			name="dryMatch"
			checked={displayDryMatch}
			onchange={handleDryMatchChange} />
	</label>
	<label>
		Display Original:
		<input
			type="checkbox"
			name="original"
			checked={displayOriginal}
			onchange={handleOriginalChange} />
	</label>
</fieldset>
