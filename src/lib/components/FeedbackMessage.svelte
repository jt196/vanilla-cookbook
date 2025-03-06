<script>
	import { fade } from 'svelte/transition'

	/** @type {{message?: string}} */
	let { message = '' } = $props();
	let show = $state(false)

	$effect(() => {
		if (message) {
			show = true
			setTimeout(() => {
				show = false
			}, 3000)
		}
	});
</script>

{#if show && message}
	<div transition:fade>
		{message}
	</div>
{/if}
