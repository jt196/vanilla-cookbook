<script>
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
		Settings
	</a>
	<a
		role="tab"
		class="tab"
		class:tab-active={data.pathname === `/user/${user.userId}/options/password`}
		href={`/user/${user.userId}/options/password`}>
		Password
	</a>
	<a
		role="tab"
		class="tab"
		class:tab-active={data.pathname === `/user/${user.userId}/options/bookmark`}
		href={`/user/${user.userId}/options/bookmark`}>
		Bookmark
	</a>
	<a
		role="tab"
		class="tab"
		class:tab-active={data.pathname === `/user/${user.userId}/options/import`}
		href={`/user/${user.userId}/options/import`}>
		Import
	</a>
	<a
		role="tab"
		class="tab"
		class:tab-active={data.pathname === `/user/${user.userId}/options/export`}
		href={`/user/${user.userId}/options/export`}>
		Export
	</a>
	{#if data.user.isAdmin}
		<a
			role="tab"
			class="tab"
			class:tab-active={data.pathname === `/user/${user.userId}/options/admin/users`}
			href={`/user/${user.userId}/options/admin/users`}>
			Users
		</a>
		<a
			role="tab"
			class="tab"
			class:tab-active={data.pathname === `/user/${user.userId}/options/admin/site`}
			href={`/user/${user.userId}/options/admin/site`}>
			Site
		</a>
	{/if}
</div>

<div class="bg-base-100 border border-base-300 rounded-b-lg p-6">
	{@render children?.()}
</div>
