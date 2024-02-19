<script>
	import Images from '$lib/components/svg/Images.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import Edit from '$lib/components/svg/Edit.svelte'
	import TickRound from '$lib/components/svg/TickRound.svelte'
	import { goto } from '$app/navigation'
	import { addRecipeLog, addRecipeToFavourites, deleteRecipeById } from '$lib/utils/crud'
	import Favourite from './svg/Favourite.svelte'

	async function handleDelete(uid) {
		const success = await deleteRecipeById(uid)
		if (success) {
			goto('/')
		}
	}

	async function handleFavourite(uid) {
		console.log('Handle favourites button clicked for uid: ' + uid)
		const success = await addRecipeToFavourites(uid)
		if (success) {
			favRecipe(success)
		}
	}

	async function handleLog(uid) {
		let response = await addRecipeLog(uid)
		if (response.success) {
			const newLog = response.data
			console.log('🚀 ~ handleLog ~ newLog:', newLog.recipeLog)
			updateLogs(newLog.recipeLog, response)
		} else {
			console.log('Failed to log recipe!')
		}
	}

	export let recipe
	export let updateLogs
	export let favRecipe
</script>

<div class="buttons">
	<a
		href="/recipe/{recipe?.uid}/edit/"
		role="button"
		class="outline contrast"
		data-tooltip="Edit Recipe"
		data-testid="edit-button">
		<Edit width="30px" height="30px" fill="var(--pico-ins-color)" />
	</a>
	<button
		on:click={(event) => handleFavourite(recipe?.uid)}
		data-tooltip="Favourite Recipe"
		class="outline secondary">
		<Favourite
			favourite={recipe?.on_favorites}
			width="30px"
			height="30px"
			fill="var(--pico-del-color)" />
	</button>
	<button
		on:click={() => handleDelete(recipe?.uid)}
		data-testid="delete-button"
		data-tooltip="Delete Recipe"
		class="outline secondary">
		<Delete width="30px" height="30px" fill="var(--pico-del-color)" />
	</button>
	<button
		on:click={() => handleLog(recipe?.uid)}
		class="outline contrast"
		data-tooltip="Mark Recipe Cooked Today"
		data-testid="check-button">
		<TickRound width="30px" height="30px" fill="var(--pico-ins-color)" />
	</button>
	<a
		href="/recipe/{recipe?.uid}/images/"
		role="button"
		data-tooltip="Edit Recipe Images"
		class="outline contrast"
		data-testid="edit-button">
		<Images width="30px" height="30px" fill="var(--pico-ins-color)" />
	</a>
</div>

<style lang="scss">
	.buttons {
		display: flex;
		flex-direction: row;
		gap: 0.3rem;
		@media (max-width: 451px) {
			width: 100%;
		}
	}
</style>
