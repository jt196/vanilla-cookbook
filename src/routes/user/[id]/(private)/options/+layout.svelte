<script>
	import { t } from '$lib/stores/locale.js'

	/** @type {{data: any, children?: import('svelte').Snippet}} */
	let { data, children } = $props()

	const { user } = $state(data)
</script>

<div role="tablist" class="tabs tabs-box">
	<a
		role="tab"
		class="tab"
		class:tab-active={data.pathname === `/user/${user.userId}/options/settings`}
		href={`/user/${user.userId}/options/settings`}>
		{$t('options.settings')}
	</a>
	<a
		role="tab"
		class="tab"
		class:tab-active={data.pathname === `/user/${user.userId}/options/recipes`}
		href={`/user/${user.userId}/options/recipes`}>
		{$t('options.recipes')}
	</a>
	<a
		role="tab"
		class="tab"
		class:tab-active={data.pathname === `/user/${user.userId}/options/bookmark`}
		href={`/user/${user.userId}/options/bookmark`}>
		{$t('options.bookmark')}
	</a>
	<a
		role="tab"
		class="tab"
		class:tab-active={data.pathname === `/user/${user.userId}/options/import`}
		href={`/user/${user.userId}/options/import`}>
		{$t('options.import')}
	</a>
	<a
		role="tab"
		class="tab"
		class:tab-active={data.pathname === `/user/${user.userId}/options/export`}
		href={`/user/${user.userId}/options/export`}>
		{$t('options.export')}
	</a>
	{#if data.user.isAdmin}
		<a
			role="tab"
			class="tab"
			class:tab-active={data.pathname === `/user/${user.userId}/options/admin/users`}
			href={`/user/${user.userId}/options/admin/users`}>
			{$t('options.users')}
		</a>
		<a
			role="tab"
			class="tab"
			class:tab-active={data.pathname === `/user/${user.userId}/options/admin/site`}
			href={`/user/${user.userId}/options/admin/site`}>
			{$t('options.site')}
		</a>
	{/if}
</div>

<div class="bg-base-100 border border-base-300 rounded-b-lg p-6">
	{@render children?.()}
</div>
