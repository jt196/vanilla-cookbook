<script>
	import Images from '$lib/components/svg/Images.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import Edit from '$lib/components/svg/Edit.svelte'
	import { goto } from '$app/navigation'
	import { deleteRecipeById } from '$lib/utils/crud'

	async function handleDelete(uid) {
		const success = await deleteRecipeById(uid)
		if (success) {
			goto('/')
		}
	}

	export let recipe
</script>

<a href="/{recipe?.uid}/edit/" role="button" class="outline contrast" data-testid="edit-button">
	<Edit width="30px" height="30px" fill="var(--pico-ins-color)" />
</a>
<button
	on:click={() => handleDelete(recipe?.uid)}
	data-testid="delete-button"
	class="outline secondary">
	<Delete width="30px" height="30px" fill="var(--pico-del-color)" />
</button>
<a href="/{recipe?.uid}/images/" role="button" class="outline contrast" data-testid="edit-button">
	<Images width="30px" height="30px" fill="var(--pico-ins-color)" />
</a>
