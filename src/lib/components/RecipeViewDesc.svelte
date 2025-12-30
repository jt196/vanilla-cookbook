<script>
	import { getSanitizedHTML } from '$lib/utils/render'
	
	/** @type {{recipe: any}} */
	let { recipe } = $props();

	let descriptionLines = []
	let sanitisedDescription = $state([])

	const loadSanitizedDescription = async () => {
		if (recipe.description) {
			descriptionLines = recipe.description.split('\n')
			// Use Promise.all to await multiple asynchronous operations
			sanitisedDescription = await Promise.all(
				descriptionLines.map((direction) => getSanitizedHTML(direction))
			)
		}
	}

	$effect(() => {
		if (recipe.description) {
			loadSanitizedDescription()
		}
	});
</script>

{#if sanitisedDescription.length > 0}
	<h3 class="text-2xl font-bold mb-4 mt-6">Description</h3>
	{#each sanitisedDescription as parsedDescription}
		<p class="text-base mb-3 leading-relaxed">
			{@html parsedDescription}
		</p>
	{/each}
{/if}
