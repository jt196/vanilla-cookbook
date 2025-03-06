<script>
	/** @type {{displayExtra: any}} */
	let { displayExtra, onDisplayExtraChange } = $props()

	function handleExtraChange(e) {
		onDisplayExtraChange && onDisplayExtraChange(e.target.checked)
	}
</script>

<fieldset data-tooltip="Display more ingredient information">
	<label>
		Display extra:
		<input type="checkbox" name="english" checked={displayExtra} onchange={handleExtraChange} />
	</label>
</fieldset>
