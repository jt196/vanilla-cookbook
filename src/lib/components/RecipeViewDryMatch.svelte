<script>
	export let displayDryMatch
</script>

<fieldset data-tooltip="When converting from/to cups, display matched ingredients">
	<label>
		Display Dry Ingredients Match:
		<input type="checkbox" name="english" bind:checked={displayDryMatch} />
	</label>
</fieldset>
