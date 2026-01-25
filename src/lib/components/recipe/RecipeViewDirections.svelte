<script>
	/** @type {{directionLines?: any, sanitizedDirections?: any, loadingIngredients?: boolean}} */
	let { directionLines = [], sanitizedDirections = [], loadingIngredients = false } = $props();
</script>

{#if directionLines.length > 0}
	<div class="prose max-w-none mt-6">
		<h3>Directions</h3>

		{#if loadingIngredients}
			<!-- Show skeleton while ingredients are loading (needed for ingredient matching) -->
			<div class="space-y-3">
				{#each directionLines as _}
					<div class="skeleton h-4 w-full"></div>
					<div class="skeleton h-4 w-3/4"></div>
				{/each}
			</div>
		{:else}
			{#each sanitizedDirections as parsedDirection}
				<p>{@html parsedDirection}</p>
			{/each}
		{/if}
	</div>
{/if}
