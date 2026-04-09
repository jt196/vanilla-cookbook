<script>
	import Timeline from '$lib/components/ui/Timeline.svelte'
	import TimelineItem from '$lib/components/ui/TimelineItem.svelte'
	import { t } from '$lib/stores/locale.js'

	/** @type {{data: any}} */
	let { data } = $props()

	let logs = $state(
		[...data.logs].sort((a, b) => new Date(b.cooked).getTime() - new Date(a.cooked).getTime())
	)

	// Count how many logs share each calendar day (local date string)
	const dayCounts = $derived(() => {
		const counts = new Map()
		for (const log of logs) {
			const day = new Date(log.cooked).toLocaleDateString()
			counts.set(day, (counts.get(day) ?? 0) + 1)
		}
		return counts
	})

	function formatStart(cookedIso) {
		const date = new Date(cookedIso)
		const day = date.toLocaleDateString()
		const multipleOnDay = dayCounts().get(day) > 1
		if (multipleOnDay) {
			return (
				date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) +
				', ' +
				date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
			)
		}
		return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
	}
</script>

<div class="prose max-w-none mb-6 flex justify-center">
	<h2>{$t('calendar.title')}</h2>
</div>

{#if logs.length === 0}
	<p class="text-base-content/60">{$t('calendar.empty')}</p>
{:else}
	<Timeline>
		{#each logs as log, i}
			<TimelineItem start={formatStart(log.cooked)} first={i === 0} last={i === logs.length - 1}>
				<a href="/recipe/{log.recipe.uid}/view" class="font-medium no-underline text-current hover:underline">
					{log.recipe.name}
				</a>
			</TimelineItem>
		{/each}
	</Timeline>
{/if}
