<script>
	import Images from '$lib/components/svg/Images.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import Edit from '$lib/components/svg/Edit.svelte'
	import { goto } from '$app/navigation'
	import {
		addRecipeLog,
		changeRecipeFavourite,
		changeRecipePublic,
		deleteRecipeById
	} from '$lib/utils/crud'
	import Favourite from './svg/Favourite.svelte'
	import Check from './svg/Check.svelte'
	import RecipeShareButton from './RecipeShareButton.svelte'
	import Public from './svg/Public.svelte'

	/** @type {{recipe: any, updateLogs: any, favRecipe: any}} */
	let { recipe, updateLogs, favRecipe, pubRecipe, logs, viewOnly } = $props()

	async function handleDelete(uid) {
		const success = await deleteRecipeById(uid)
		if (success) {
			goto('/')
		}
	}

	async function handleFavourite(uid) {
		console.log('Handle favourites button clicked for uid: ' + uid)
		const success = await changeRecipeFavourite(uid)
		if (success) {
			favRecipe(success)
		}
	}

	async function handlePublic(uid) {
		console.log('Handle public button clicked for uid: ' + uid)
		const success = await changeRecipePublic(uid)
		if (success) {
			pubRecipe(success)
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
	{#if !viewOnly || recipe.is_public}
		<RecipeShareButton
			name={recipe.name}
			isPublic={recipe.is_public}
			uid={recipe.uid}
			{pubRecipe} />
	{:else}
		<Public isPublic={recipe.is_public} width="20px" height="20px" fill="var(--pico-del-color)" />
	{/if}
	{#if !viewOnly}
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
			onclick={(event) => handlePublic(recipe?.uid)}
			data-tooltip={recipe?.is_public ? 'Private Recipe?' : 'Public Recipe?'}
			class="outline secondary">
			<Public
				isPublic={recipe?.is_public}
				width="20px"
				height="20px"
				fill={recipe?.is_public ? 'var(--pico-ins-color)' : 'var(--pico-del-color)'} />
		</button>
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
	{/if}
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
