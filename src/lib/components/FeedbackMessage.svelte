<script>
	import { fade } from 'svelte/transition'

	/** @type {{message?: string}} */
	let { message = '', timeout = 3000, type = 'info' } = $props()
	let show = $state(false)

	$effect(() => {
		if (message) {
			show = true
			setTimeout(() => {
				show = false
			}, timeout)
		}
	})

	// Define colors based on the message type
	const colors = {
		success: 'var(--pico-ins-color)',
		error: 'var(--pico-del-color)',
		info: 'var(--pico-primary)'
	}
</script>

{#if show && message}
	<div transition:fade class="feedback-message" style="color: {colors[type]};">
		{message}
	</div>
{/if}
