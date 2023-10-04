<script>
	export let recipe
</script>

{#if recipe?.description}
	<h3>Description:</h3>
	<p>
		{recipe?.description}
	</p>
{/if}
