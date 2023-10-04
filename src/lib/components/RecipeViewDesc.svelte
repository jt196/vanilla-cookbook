<script>
	import { getSanitizedHTML } from '$lib/utils/render'

	export let recipe

	let descriptionLines = []
	let sanitisedDescription = []

	recipe.description ? (descriptionLines = recipe.description.split('\n')) : null
	sanitisedDescription
		? (sanitisedDescription = descriptionLines.map((direction) => getSanitizedHTML(direction)))
		: null
</script>

{#if recipe?.description}
	<h3>Description:</h3>
	{#each sanitisedDescription as parsedDescription}
		<p>
			{@html parsedDescription}
		</p>
	{/each}
{/if}
