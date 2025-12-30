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

<div class="flex items-center gap-2 text-base-content">
	<IconButton onclick={onToggleTheme} aria-label="Toggle theme">
		<Theme {theme} width="25px" />
	</IconButton>

	<a href="/users" class="btn btn-ghost btn-circle text-base-content" aria-label="Users">
		<Users width="25px" />
	</a>

	{#if !user}
		<a href="/login" class="btn btn-primary">Login</a>
		{#if settings?.registrationAllowed}
			<a href="/register" class="btn btn-ghost">Register</a>
		{/if}
	{:else}
		<a href="/recipe/new" class="btn btn-ghost btn-circle text-base-content" aria-label="New recipe">
			<New width="25px" />
		</a>
		<a href={`/user/${user.userId}/shopping`} class="btn btn-ghost btn-circle text-base-content" aria-label="Shopping list">
			<Shopping width="25px" />
		</a>
		<a href={`/user/${user.userId}/calendar`} class="btn btn-ghost btn-circle text-base-content" aria-label="Calendar">
			<Calendar width="25px" />
		</a>
		<a href={`/user/${user.userId}/options/settings`} class="btn btn-ghost btn-circle text-base-content" aria-label="Settings">
			<Settings width="25px" />
		</a>
	{/if}
</div>
