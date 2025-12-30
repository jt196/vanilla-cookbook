<script>
	import Card from '$lib/components/ui/Card.svelte'

	/** @type {{item: any}} */
	let { item } = $props()
</script>

<a href="/user/{item.id}/recipes/" class="block no-underline text-current">
	<Card class="hover:bg-base-200 transition-colors">
		{#snippet title()}
			{item.username}
		{/snippet}
		{#snippet children()}
			<p class="text-sm opacity-80">
				Public Recipes: <i>{item.publicRecipesCount}/{item.totalRecipesCount}</i>
			</p>
		{/snippet}
	</Card>
</a>
