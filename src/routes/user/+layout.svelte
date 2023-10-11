<script>
	export let data
</script>

<div class="container">
	<nav>
		<ul>
			<form method="POST">
				<li>
					<a href="/user/password" class={data.pathname === '/user/password' ? 'active-link' : ''}>
						Password
					</a>
				</li>
				<li>
					<a href="/user/bookmark" class={data.pathname === '/user/bookmark' ? 'active-link' : ''}>
						Bookmark
					</a>
				</li>
				<li>
					<a href="/user/import" class={data.pathname === '/user/import' ? 'active-link' : ''}>
						Import
					</a>
				</li>
				<li>
					<a href="/user/upload" class={data.pathname === '/user/upload' ? 'active-link' : ''}>
						Upload
					</a>
				</li>
				{#if data.user.isAdmin}
					<li>
						<a href="/user/users" class={data.pathname === '/user/users' ? 'active-link' : ''}>
							Users
						</a>
					</li>
					<li>
						<a href="/user/site" class={data.pathname === '/user/site' ? 'active-link' : ''}>
							Site
						</a>
					</li>
				{/if}
			</form>
		</ul>
	</nav>
	<slot />
</div>

<style>
	.active-link {
		color: white;
		font-weight: bold;
	}
</style>
