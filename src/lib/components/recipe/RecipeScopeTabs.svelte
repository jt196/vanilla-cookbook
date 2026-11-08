<script>
	import { t } from '$lib/stores/locale.js'

	/**
	 * Switch between the viewer's own recipes and everyone's visible recipes.
	 *
	 * @type {{ userId: string, active: 'mine' | 'all' }}
	 */
	let { userId, active } = $props()

	const tabs = $derived([
		{ id: 'mine', href: `/user/${userId}/recipes`, label: $t('nav.myRecipes') },
		{ id: 'all', href: '/recipes', label: $t('nav.allRecipes') }
	])
</script>

<nav class="mb-4 flex justify-center" aria-label={$t('nav.recipes')}>
	<div class="tabs tabs-box">
		{#each tabs as tab (tab.id)}
			<a
				href={tab.href}
				class="tab"
				class:tab-active={tab.id === active}
				aria-current={tab.id === active ? 'page' : undefined}>{tab.label}</a>
		{/each}
	</div>
</nav>
