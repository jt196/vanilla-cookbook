<script>
	export let data
</script>

<div class="container">
	<nav>
		<ul>
			<form method="POST">
				<li>
					<a href="/user/settings" class={data.pathname === '/user/settings' ? 'active-link' : ''}>
						Settings
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
