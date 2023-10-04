<script>
	export let displayDryMatch
	export let displayOriginal
</script>

<fieldset data-tooltip="When converting from/to cups, display matched ingredients">
	<label>
		Display DryIng Match:
		<input type="checkbox" name="english" bind:checked={displayDryMatch} />
	</label>
	<label>
		Display Original:
		<input type="checkbox" name="english" bind:checked={displayOriginal} />
	</label>
</fieldset>
