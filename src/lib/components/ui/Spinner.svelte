<script>
	import { fade } from 'svelte/transition'
	import { t } from '$lib/stores/locale.js'

	let {
		visible = false,
		spinnerContent = '',
		transitionTime = 300,
		inline = false,
		inlineClass = '',
		/**
		 * Loading animation style
		 * @type {'spinner' | 'dots' | 'ring' | 'ball' | 'bars' | 'infinity'}
		 */
		type = 'spinner',
		/**
		 * Loading size
		 * @type {'xs' | 'sm' | 'md' | 'lg' | 'xl'}
		 */
		size = 'lg',
		/**
		 * Color using text utilities
		 * @type {'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error'}
		 */
		color = 'primary'
	} = $props()

	const typeClass = $derived(`loading-${type}`)
	const sizeClass = $derived(`loading-${size}`)
	const colorClass = $derived(`text-${color}`)
	const resolvedSpinnerContent = $derived(spinnerContent || $t('common.loading'))
</script>

{#if visible}
	{#if inline}
		<div class={`inline-flex items-center justify-center ${inlineClass}`.trim()} aria-busy="true">
			<span class="loading {typeClass} {sizeClass} {colorClass}" aria-label={resolvedSpinnerContent}
			></span>
		</div>
	{:else}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			aria-busy="true"
			transition:fade={{ duration: transitionTime }}
		>
			<div class="flex flex-col items-center gap-4 bg-base-100 p-8 rounded-lg shadow-xl">
				<span class="loading {typeClass} {sizeClass} {colorClass}"></span>
				<p class="text-lg text-base-content">{resolvedSpinnerContent}</p>
			</div>
		</div>
	{/if}
{/if}
