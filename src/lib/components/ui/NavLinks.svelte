<script>
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'
	import Shopping from '$lib/components/svg/Shopping.svelte'
	import Calendar from '$lib/components/svg/Calendar.svelte'
	import New from '$lib/components/svg/New.svelte'
	import Theme from '$lib/components/svg/Theme.svelte'
	import Settings from '$lib/components/svg/Settings.svelte'
	import List from '$lib/components/svg/List.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import TickSymbol from '$lib/components/svg/TickSymbol.svelte'
	import { t } from '$lib/stores/locale.js'
	import { themePreferences, THEME_LIGHT, THEME_DARK } from '$lib/utils/theme.js'

	/** @type {{user: any, settings: any, themePreference: 'light' | 'dracula' | 'auto', onThemeChange: (preference: 'light' | 'dracula' | 'auto') => void, mobile?: boolean}} */
	let { user, settings, themePreference, onThemeChange, mobile = false } = $props()

	/** @param {string} preference */
	function themeLabel(preference) {
		if (preference === THEME_LIGHT) return $t('nav.themeLight')
		if (preference === THEME_DARK) return $t('nav.themeDark')
		return $t('nav.themeAuto')
	}

	/**
	 * Pick a theme from the desktop dropdown and close it.
	 * @param {MouseEvent & { currentTarget: HTMLElement }} event
	 * @param {'light' | 'dracula' | 'auto'} preference
	 */
	function chooseTheme(event, preference) {
		onThemeChange(preference)
		event.currentTarget.closest('details')?.removeAttribute('open')
	}
</script>

{#if mobile}
	<!-- Mobile menu layout - list items only (parent provides <ul>) -->
	<li>
		<div class="flex flex-col items-stretch gap-2 hover:bg-transparent active:bg-transparent">
			<span id="mobile-theme-label" class="text-primary">
				{$t('nav.theme')} · {themeLabel(themePreference)}
			</span>
			<div class="join w-full" role="group" aria-labelledby="mobile-theme-label">
				{#each themePreferences as preference (preference)}
					<button
						type="button"
						class="btn btn-sm join-item flex-1"
						class:btn-primary={themePreference === preference}
						aria-label={themeLabel(preference)}
						title={themeLabel(preference)}
						aria-pressed={themePreference === preference}
						onclick={() => onThemeChange(preference)}>
						<Theme theme={preference} width="16px" height="16px" />
					</button>
				{/each}
			</div>
		</div>
	</li>
	<li>
		<a href="/recipes" class="flex items-center gap-2 text-primary">
			<FoodBowl width="20px" /><span>{$t('nav.allRecipes')}</span>
		</a>
	</li>
	{#if !user}
		<li><a href="/login" class="flex items-center gap-2"><span>{$t('nav.login')}</span></a></li>
		{#if settings?.registrationAllowed}
			<li>
				<a href="/register" class="flex items-center gap-2"><span>{$t('nav.register')}</span></a>
			</li>
		{/if}
	{:else}
		<li>
			<a href={`/user/${user.userId}/recipes`} class="flex items-center gap-2 text-primary"
				><List width="20px" /><span>{$t('nav.myRecipes')}</span></a>
		</li>
		<li>
			<a href="/recipe/new" class="flex items-center gap-2 text-primary"
				><New width="20px" /><span>{$t('nav.newRecipe')}</span></a>
		</li>
		<li>
			<a href={`/user/${user.userId}/shopping`} class="flex items-center gap-2 text-primary"
				><Shopping width="20px" /><span>{$t('nav.shopping')}</span></a>
		</li>
		<li>
			<a href={`/user/${user.userId}/calendar`} class="flex items-center gap-2 text-primary"
				><Calendar width="20px" /><span>{$t('nav.calendar')}</span></a>
		</li>
		<li>
			<a href={`/user/${user.userId}/options/settings`} class="flex items-center gap-2 text-primary"
				><Settings width="20px" /><span>{$t('nav.settings')}</span></a>
		</li>
	{/if}
{:else}
	<!-- Desktop layout - horizontal icons -->
	<div class="flex items-center gap-2 text-base-content">
		<DropdownMenu
			align="end"
			summaryClass="btn btn-ghost btn-circle text-primary"
			summaryAriaLabel={`${$t('nav.theme')}: ${themeLabel(themePreference)}`}
			contentClass="menu dropdown-content bg-base-100 rounded-box z-50 w-48 p-2 shadow-sm">
			{#snippet trigger()}
				<Theme theme={themePreference} width="25px" />
			{/snippet}
			<ul>
				{#each themePreferences as preference (preference)}
					<li>
						<button
							type="button"
							class="flex items-center gap-2"
							class:menu-active={themePreference === preference}
							aria-pressed={themePreference === preference}
							onclick={(event) => chooseTheme(event, preference)}>
							<Theme theme={preference} width="16px" height="16px" />
							<span class="flex-1 text-left">{themeLabel(preference)}</span>
							{#if themePreference === preference}
								<TickSymbol width="14px" height="14px" />
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</DropdownMenu>

		<a
			href="/recipes"
			class="btn btn-ghost btn-circle text-primary"
			aria-label={$t('nav.allRecipes')}>
			<FoodBowl width="25px" />
		</a>

		{#if !user}
			<a href="/login" class="btn btn-primary">{$t('nav.login')}</a>
			{#if settings?.registrationAllowed}
				<a href="/register" class="btn btn-ghost">{$t('nav.register')}</a>
			{/if}
		{:else}
			<a
				href={`/user/${user.userId}/recipes`}
				class="btn btn-ghost btn-circle text-primary"
				aria-label={$t('nav.myRecipes')}>
				<List width="25px" />
			</a>
			<a
				href="/recipe/new"
				class="btn btn-ghost btn-circle text-primary"
				aria-label={$t('nav.newRecipe')}>
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
