<script>
	import { getSanitizedHTML } from '$lib/utils/render'

	export let recipe

	let descriptionLines = []
	let sanitisedDescription = []

	const loadSanitizedDescription = async () => {
		if (recipe.description) {
			descriptionLines = recipe.description.split('\n')
			// Use Promise.all to await multiple asynchronous operations
			sanitisedDescription = await Promise.all(
				descriptionLines.map((direction) => getSanitizedHTML(direction))
			)
		}
	}

	$: if (recipe.description) {
		loadSanitizedDescription()
	}
</script>

{#if recipe?.description}
	<h3>Description:</h3>
	{#each sanitisedDescription as parsedDescription}
		<p>
			{@html parsedDescription}
		</p>
	{/each}
{/if}
