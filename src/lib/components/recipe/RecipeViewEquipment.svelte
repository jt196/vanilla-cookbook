<script>
	import { t } from '$lib/stores/locale.js'

	/** @type {{equipment?: string | null}} */
	let { equipment = '' } = $props()

	// One item per line; rendered as plain text
	const items = $derived(
		(equipment || '')
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean)
	)
</script>

{#if items.length > 0}
	<div class="mt-6">
		<h3 class="text-2xl font-bold mb-2">{$t('recipeView.equipment')}</h3>
		<ul class="list-disc pl-5 space-y-1">
			{#each items as item, index (index)}
				<li>{item}</li>
			{/each}
		</ul>
	</div>
{/if}
