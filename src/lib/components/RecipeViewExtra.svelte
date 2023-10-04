<script>
	export let displayExtra
</script>

<fieldset data-tooltip="Display more ingredient information">
	<label>
		Display extra:
		<input type="checkbox" name="english" bind:checked={displayExtra} />
	</label>
</fieldset>
