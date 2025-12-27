<script>
	import Users from '$lib/components/svg/Users.svelte'
	import Shopping from '$lib/components/svg/Shopping.svelte'
	import Calendar from '$lib/components/svg/Calendar.svelte'
	import New from '$lib/components/svg/New.svelte'
	import Theme from '$lib/components/svg/Theme.svelte'
	import Settings from '$lib/components/svg/Settings.svelte'
	import IconButton from '$lib/components/ui/IconButton.svelte'

	/** @type {{user: any, settings: any, theme: string, onToggleTheme: () => void}} */
	let { user, settings, theme, onToggleTheme } = $props()
</script>

<ul>
	<form method="POST">
		<li>
			<IconButton onclick={onToggleTheme} aria-label="Toggle theme">
				<Theme {theme} width="25px" />
			</IconButton>
		</li>
		<li><a href="/users"><Users width="25px" /></a></li>
		{#if !user}
			<a href="/login" role="button">Login</a>
			{#if settings?.registrationAllowed}
				<li><a href="/register">Register</a></li>
			{/if}
		{:else}
			<li><a href="/recipe/new"><New width="25px" /></a></li>
			<li><a href={`/user/${user.userId}/shopping`}><Shopping width="25px" /></a></li>
			<li><a href={`/user/${user.userId}/calendar`}><Calendar width="25px" /></a></li>
			<li><a href={`/user/${user.userId}/options/settings`}><Settings width="25px" /></a></li>
		{/if}
	</form>
</ul>
