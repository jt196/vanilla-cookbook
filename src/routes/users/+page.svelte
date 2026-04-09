<script>
	import UserList from '$lib/components/user/UserList.svelte'
	import { t } from '$lib/stores/locale.js'

	/** @type {{data: any}} */
	let { data } = $props()
	const { filteredUsers, userCount } = $state(data)
</script>

<div class="prose max-w-none flex justify-center">
	<h2>{$t('recipe.vanillaUsers')}</h2>
</div>
{#if userCount === 0}
	<p>{$t('recipe.noOtherUsers')}</p>
{:else}
	<UserList users={filteredUsers} />
{/if}
