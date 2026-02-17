<script>
	import { getSanitizedHTML } from '$lib/utils/render'
	import CollapseSection from '$lib/components/ui/CollapseSection.svelte'
	
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
	<CollapseSection title="Description" className="mt-2">
		<div class="prose max-w-none">
			{#each sanitisedDescription as parsedDescription}
				<p>{@html parsedDescription}</p>
			{/each}
		</div>
	</CollapseSection>
{/if}
