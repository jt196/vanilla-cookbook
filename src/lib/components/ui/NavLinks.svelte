<script>
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'
	import Shopping from '$lib/components/svg/Shopping.svelte'
	import Calendar from '$lib/components/svg/Calendar.svelte'
	import New from '$lib/components/svg/New.svelte'
	import Theme from '$lib/components/svg/Theme.svelte'
	import Settings from '$lib/components/svg/Settings.svelte'
	import List from '$lib/components/svg/List.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { t } from '$lib/stores/locale.js'

	/** @type {{user: any, settings: any, theme: string, onToggleTheme: () => void, mobile?: boolean}} */
	let { user, settings, theme, onToggleTheme, mobile = false } = $props()
</script>

{#if mobile}
	<!-- Mobile menu layout - list items only (parent provides <ul>) -->
	<li>
		<button
			aria-label={$t('nav.toggleTheme')}
			onclick={onToggleTheme}
			class="flex items-center gap-2 text-primary">
			<Theme {theme} width="20px" />
			<span>{$t('nav.toggleTheme')}</span>
		</button>
	</li>
	<li>
		<a href="/recipes" class="flex items-center gap-2 text-primary">
			<FoodBowl width="20px" /><span>{$t('nav.allRecipes')}</span>
		</a>
	</li>
	{#if !user}
		<li><a href="/login" class="flex items-center gap-2"><span>{$t('nav.login')}</span></a></li>
		{#if settings?.registrationAllowed}
			<li><a href="/register" class="flex items-center gap-2"><span>{$t('nav.register')}</span></a></li>
		{/if}
	{:else}
		<li><a href={`/user/${user.userId}/recipes`} class="flex items-center gap-2 text-primary"><List width="20px" /><span>{$t('nav.myRecipes')}</span></a></li>
		<li><a href="/recipe/new" class="flex items-center gap-2 text-primary"><New width="20px" /><span>{$t('nav.newRecipe')}</span></a></li>
		<li><a href={`/user/${user.userId}/shopping`} class="flex items-center gap-2 text-primary"><Shopping width="20px" /><span>{$t('nav.shopping')}</span></a></li>
		<li><a href={`/user/${user.userId}/calendar`} class="flex items-center gap-2 text-primary"><Calendar width="20px" /><span>{$t('nav.calendar')}</span></a></li>
		<li><a href={`/user/${user.userId}/options/settings`} class="flex items-center gap-2 text-primary"><Settings width="20px" /><span>{$t('nav.settings')}</span></a></li>
	{/if}
{:else}
	<!-- Desktop layout - horizontal icons -->
	<div class="flex items-center gap-2 text-base-content">
		<Button
			style="ghost"
			color="neutral"
			class="btn-circle text-primary shadow-none border-none hover:bg-base-300"
			aria-label={$t('nav.toggleTheme')}
			onclick={onToggleTheme}>
			<Theme {theme} width="25px" />
		</Button>

		<a href="/recipes" class="btn btn-ghost btn-circle text-primary" aria-label={$t('nav.allRecipes')}>
			<FoodBowl width="25px" />
		</a>

		{#if !user}
			<a href="/login" class="btn btn-primary">{$t('nav.login')}</a>
			{#if settings?.registrationAllowed}
				<a href="/register" class="btn btn-ghost">{$t('nav.register')}</a>
			{/if}
		{:else}
			<a href={`/user/${user.userId}/recipes`} class="btn btn-ghost btn-circle text-primary" aria-label={$t('nav.myRecipes')}>
				<List width="25px" />
			</a>
			<a href="/recipe/new" class="btn btn-ghost btn-circle text-primary" aria-label={$t('nav.newRecipe')}>
				<New width="25px" />
			</a>
			<a
				href={`/user/${user.userId}/shopping`}
				class="btn btn-ghost btn-circle text-primary"
				aria-label={$t('nav.shoppingList')}>
				<Shopping width="25px" />
			</a>
			<a
				href={`/user/${user.userId}/calendar`}
				class="btn btn-ghost btn-circle text-primary"
				aria-label={$t('nav.calendar')}>
				<Calendar width="25px" />
			</a>
			<a
				href={`/user/${user.userId}/options/settings`}
				class="btn btn-ghost btn-circle text-primary"
				aria-label={$t('nav.settings')}>
				<Settings width="25px" />
			</a>
		{/if}
	</div>
{/if}
