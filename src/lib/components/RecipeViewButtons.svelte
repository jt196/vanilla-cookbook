<script>
	import Images from '$lib/components/svg/Images.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import Edit from '$lib/components/svg/Edit.svelte'
	import { goto } from '$app/navigation'
	import { addRecipeLog, addRecipeToFavourites, deleteRecipeById } from '$lib/utils/crud'
	import Favourite from './svg/Favourite.svelte'
	import Check from './svg/Check.svelte'

	/** @type {{recipe: any, updateLogs: any, favRecipe: any}} */
	let { recipe, updateLogs, favRecipe, logs } = $props()

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
</script>

<div class="buttons">
	<a
		href="/recipe/{recipe?.uid}/edit/"
		role="button"
		class="outline secondary"
		data-tooltip="Edit Recipe"
		data-testid="edit-button">
		<Edit width="20px" height="20px" fill="var(--pico-ins-color)" />
	</a>
	<a
		href="/recipe/{recipe?.uid}/images/"
		role="button"
		data-tooltip="Edit Recipe Images"
		class="outline contrast"
		data-testid="edit-button">
		<Images width="20px" height="20px" fill="var(--pico-ins-color)" />
	</a>
	<button
		onclick={(event) => handleFavourite(recipe?.uid)}
		data-tooltip={recipe?.on_favorites ? 'Unfavourite Recipe' : 'Favourite Recipe'}
		class="outline secondary">
		<Favourite
			favourite={recipe?.on_favorites}
			width="20px"
			height="20px"
			fill={recipe?.on_favorites ? 'var(--pico-del-color)' : 'var(--pico-secondary-focus)'} />
	</button>
	<button
		onclick={() => handleLog(recipe?.uid)}
		class="outline secondary"
		data-tooltip="Mark Recipe Cooked Today"
		data-testid="check-button">
		<Check
			width="20px"
			height="20px"
			checked={logs?.length > 0}
			fill={logs?.length > 0 ? 'var(--pico-ins-color)' : 'var(--pico-secondary-focus)'} />
	</button>
	<button
		onclick={() => handleDelete(recipe?.uid)}
		data-testid="delete-button"
		data-tooltip="Delete Recipe"
		class="outline secondary">
		<Delete width="20px" height="20px" fill="var(--pico-del-color)" />
	</button>
</div>

<style lang="scss">
	.buttons {
		display: flex;
		flex-direction: row;
		gap: 0.3rem;
		flex-wrap: nowrap;
	}
	.buttons a {
		padding: 0.5rem;
	}
</style>
