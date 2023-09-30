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
						<a href="/user/admin" class={data.pathname === '/user/admin' ? 'active-link' : ''}>
							Admin
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
