<script>
	import Users from '$lib/components/svg/Users.svelte'
	import Shopping from '$lib/components/svg/Shopping.svelte'
	import Calendar from '$lib/components/svg/Calendar.svelte'
	import New from '$lib/components/svg/New.svelte'
	import Theme from '$lib/components/svg/Theme.svelte'
	import Settings from '$lib/components/svg/Settings.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	/** @type {{user: any, settings: any, theme: string, onToggleTheme: () => void, mobile?: boolean}} */
	let { user, settings, theme, onToggleTheme, mobile = false } = $props()
</script>

{#if mobile}
	<!-- Mobile menu layout - list items only (parent provides <ul>) -->
	<li>
		<button
			aria-label="Toggle theme"
			onclick={onToggleTheme}
			class="flex items-center gap-2 text-primary">
			<Theme {theme} width="20px" />
			<span>Toggle Theme</span>
		</button>
	</li>
	<li><a href="/users" class="flex items-center gap-2 text-primary"><Users width="20px" /><span>Users</span></a></li>
	{#if !user}
		<li><a href="/login" class="flex items-center gap-2"><span>Login</span></a></li>
		{#if settings?.registrationAllowed}
			<li><a href="/register" class="flex items-center gap-2"><span>Register</span></a></li>
		{/if}
	{:else}
		<li><a href="/recipe/new" class="flex items-center gap-2 text-primary"><New width="20px" /><span>New Recipe</span></a></li>
		<li><a href={`/user/${user.userId}/shopping`} class="flex items-center gap-2 text-primary"><Shopping width="20px" /><span>Shopping</span></a></li>
		<li><a href={`/user/${user.userId}/calendar`} class="flex items-center gap-2 text-primary"><Calendar width="20px" /><span>Calendar</span></a></li>
		<li><a href={`/user/${user.userId}/options/settings`} class="flex items-center gap-2 text-primary"><Settings width="20px" /><span>Settings</span></a></li>
	{/if}
{:else}
	<!-- Desktop layout - horizontal icons -->
	<div class="flex items-center gap-2 text-base-content">
		<Button
			style="ghost"
			color="neutral"
			class="btn-circle text-primary shadow-none border-none hover:bg-base-300"
			aria-label="Toggle theme"
			onclick={onToggleTheme}>
			<Theme {theme} width="25px" />
		</Button>

		<a href="/users" class="btn btn-ghost btn-circle text-primary" aria-label="Users">
			<Users width="25px" />
		</a>

		{#if !user}
			<a href="/login" class="btn btn-primary">Login</a>
			{#if settings?.registrationAllowed}
				<a href="/register" class="btn btn-ghost">Register</a>
			{/if}
		{:else}
			<a href="/recipe/new" class="btn btn-ghost btn-circle text-primary" aria-label="New recipe">
				<New width="25px" />
			</a>
			<a
				href={`/user/${user.userId}/shopping`}
				class="btn btn-ghost btn-circle text-primary"
				aria-label="Shopping list">
				<Shopping width="25px" />
			</a>
			<a
				href={`/user/${user.userId}/calendar`}
				class="btn btn-ghost btn-circle text-primary"
				aria-label="Calendar">
				<Calendar width="25px" />
			</a>
			<a
				href={`/user/${user.userId}/options/settings`}
				class="btn btn-ghost btn-circle text-primary"
				aria-label="Settings">
				<Settings width="25px" />
			</a>
		{/if}
	</div>
{/if}
