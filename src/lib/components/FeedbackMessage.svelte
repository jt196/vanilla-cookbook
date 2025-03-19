<script>
	import { fade } from 'svelte/transition'

	/** @type {{message?: string}} */
	let {
		message = '',
		timeout = 3000,
		type = 'info',
		background = 'var(--pico-background-color)'
	} = $props()

	let timeoutId

	$effect(() => {
		console.log('Message ' + message)
	})

	const colors = {
		success: 'var(--pico-ins-color)',
		error: 'var(--pico-del-color)',
		info: 'var(--pico-primary)'
	}

	$effect(() => {
		if (message) {
			clearTimeout(timeoutId) // Prevent overlapping timeouts
			timeoutId = setTimeout(() => {
				message = ''
			}, timeout)
		}
	})
</script>

{#if message}
	<div
		transition:fade
		class="feedback-message"
		style="color: {colors[type]}; background-color: {background};">
		{message}
	</div>
{/if}

<style>
	.feedback-message {
		position: fixed;
		top: calc(env(safe-area-inset-top, 0px) + 20px);
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		padding: 10px 20px;
		border: 1px solid var(--pico-muted-border-color);
		border-radius: 5px;
		font-weight: bold;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
		max-width: 80%;
		text-align: center;
		background-clip: padding-box;
	}
</style>
