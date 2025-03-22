<script>
	/** @type {{data: any, children?: import('svelte').Snippet}} */
	let { data, children } = $props()
</script>

<div class="container">
	<nav>
		<ul>
			<form method="POST">
				<li>
					<a
						href="/user/options/settings"
						class={data.pathname === '/user/options/settings' ? 'active-link' : ''}>
						Settings
					</a>
				</li>
				<li>
					<a
						href="/user/options/password"
						class={data.pathname === '/user/options/password' ? 'active-link' : ''}>
						Password
					</a>
				</li>
				<li>
					<a
						href="/user/options/bookmark"
						class={data.pathname === '/user/options/bookmark' ? 'active-link' : ''}>
						Bookmark
					</a>
				</li>
				<li>
					<a
						href="/user/options/import"
						class={data.pathname === '/user/options/import' ? 'active-link' : ''}>
						Import
					</a>
				</li>
				<li>
					<a
						href="/user/options/export"
						class={data.pathname === '/user/options/export' ? 'active-link' : ''}>
						Export
					</a>
				</li>
				<li>
					<a
						href="/user/options/upload"
						class={data.pathname === '/user/options/upload' ? 'active-link' : ''}>
						Upload
					</a>
				</li>
				{#if data.user.isAdmin}
					<li>
						<a
							href="/user/options/admin/users"
							class={data.pathname === '/user/options/admin/users' ? 'active-link' : ''}>
							Users
						</a>
					</li>
					<li>
						<a
							href="/user/options/admin/site"
							class={data.pathname === '/user/options/admin/site' ? 'active-link' : ''}>
							Site
						</a>
					</li>
				{/if}
			</form>
		</ul>
	</nav>
	{@render children?.()}
</div>

<style>
	.active-link {
		color: white;
		font-weight: bold;
	}
	form li {
		padding: 0.4rem;
	}
	nav {
		margin-bottom: 1rem;
	}
</style>
