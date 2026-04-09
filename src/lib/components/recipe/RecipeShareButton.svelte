<script>
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import { changeRecipePublic } from '$lib/utils/crud'
	import { onMount } from 'svelte'
	import Share from '$lib/components/svg/Share.svelte'
	import { get } from 'svelte/store'
	import { t } from '$lib/stores/locale.js'

	let { name, isPublic = true, uid, pubRecipe } = $props()

	const shareSupported = typeof navigator !== 'undefined' && !!navigator.share
	let baseUrl = ''

	onMount(() => {
		baseUrl = window.location.origin
	})

	let feedback = $state('')
	let showConfirmDialog = $state(false)

	let url = $derived(`${baseUrl}/recipe/${uid}/view`)

	async function share() {
		if (!isPublic) {
			showConfirmDialog = true
			return
		}

		await doShare()
	}

	async function doShare() {
		const tFn = get(t)
		if (shareSupported) {
			try {
				await navigator.share({
					title: tFn('recipe.msg.linkCopied').includes('clipboard')
						? `Vanilla Cookbook recipe: ${name}`
						: `Vanilla Cookbook recipe: ${name}`,
					text: `Check out this Vanilla Cookbook share:\n\n${name}`,
					url
				})
			} catch (err) {
				console.error('Share failed:', err)
			}
		} else {
			try {
				await navigator.clipboard.writeText(`Vanilla Recipe share:\n\n${name}\n\n${url}`)
				showConfirmDialog = false
				feedback = tFn('recipe.msg.linkCopied')
			} catch (err) {
				console.error('Clipboard copy failed:', err)
				showConfirmDialog = false
				feedback = tFn('recipe.msg.linkCopyFail')
			}
		}
	}

	async function confirmMakePublic() {
		const tFn = get(t)
		const success = await changeRecipePublic(uid)

		if (success) {
			pubRecipe(success)
			showConfirmDialog = false
			await doShare()
		} else {
			feedback = tFn('recipe.msg.makePublicFail')
			showConfirmDialog = false
		}
	}

	function cancelShare() {
		showConfirmDialog = false
	}
</script>

<button onclick={share} class="btn btn-soft btn-sm tooltip btn-primary" data-tip={$t('recipe.shareRecipe')}>
	<Share width="20px" height="20px" fill="currentColor" />
</button>

<FeedbackMessage message={feedback} type="info" />

<Dialog bind:isOpen={showConfirmDialog}>
	<h3 class="font-bold text-lg">{$t('recipe.makePublicTitle')}</h3>
	<p class="py-4">{$t('recipe.makePublicDesc')}</p>
	<div class="modal-action">
		<button class="btn btn-outline" onclick={cancelShare}>{$t('common.cancel')}</button>
		<button class="btn btn-primary" onclick={confirmMakePublic}>{$t('recipe.makePublicShare')}</button>
	</div>
</Dialog>
