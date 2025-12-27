<script>
	let {
		/**
		 * @type {'td' | 'th'}
		 */
		tag = 'td',
		/**
		 * @type {'col' | 'row' | undefined}
		 */
		scope = undefined,
		class: className = '',
		children
	} = $props()
</script>

{#if tag === 'th'}
	<th class={className} {scope}>
		{@render children()}
	</th>
{:else}
	<td class={className}>
		{@render children()}
	</td>
{/if}
