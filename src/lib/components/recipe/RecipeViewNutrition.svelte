<script>
	import Table from '$lib/components/ui/Table/Table.svelte'
	import TableHead from '$lib/components/ui/Table/TableHead.svelte'
	import TableBody from '$lib/components/ui/Table/TableBody.svelte'
	import TableRow from '$lib/components/ui/Table/TableRow.svelte'
	import TableCell from '$lib/components/ui/Table/TableCell.svelte'
	import { parseNutritionInfo, scaleNutrition } from '$lib/utils/nutrition'

	/** @type {{ nutritionalInfo?: string, scale?: number, language?: string }} */
	let {
		nutritionalInfo = '',
		scale = 1,
		language = 'eng',
		recipeUid = '',
		showCleanupAction = false,
		cleanupInProgress = false,
		onCleanup = null
	} = $props()

	const parsedNutrition = $derived(parseNutritionInfo(nutritionalInfo, language))
	const displayNutrition = $derived(scaleNutrition(parsedNutrition, scale))
	const canShowTable = $derived(
		displayNutrition.entries.length > 0 && displayNutrition.confidence >= 0.4
	)
	const hasNotes = $derived(displayNutrition.entries.some((entry) => !!entry.note))
	const statusText = $derived(
		displayNutrition.perServing
			? 'Per serving'
			: scale !== 1
				? `Per recipe (scaled ${scale}x)`
				: 'Per recipe'
	)
</script>

{#if nutritionalInfo && nutritionalInfo.trim()}
	<div class="mt-6">
		<h3 class="text-2xl font-bold mb-2">Nutrition</h3>
		<p class="text-sm text-base-content/70 mb-3">{statusText}</p>

		{#if canShowTable}
			<Table size="sm" bordered containerClass="max-w-full">
				<TableHead>
					<TableRow>
						<TableCell tag="th" scope="col">Nutrient</TableCell>
						<TableCell tag="th" scope="col">Amount</TableCell>
						{#if hasNotes}
							<TableCell tag="th" scope="col">Note</TableCell>
						{/if}
					</TableRow>
				</TableHead>
				<TableBody>
					{#each displayNutrition.entries as entry}
						<TableRow>
							<TableCell tag="th" scope="row">{entry.name}</TableCell>
							<TableCell
								>{typeof entry.quantity === 'number'
									? `${entry.quantity}${entry.unit ? ` ${entry.unit}` : ''}`
									: entry.raw}</TableCell>
							{#if hasNotes}
								<TableCell>{entry.note || '-'}</TableCell>
							{/if}
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		{:else}
			{#if showCleanupAction}
				<div class="mb-2">
					{#if onCleanup}
						<button
							type="button"
							class="btn btn-soft btn-secondary btn-xs"
							onclick={onCleanup}
							disabled={cleanupInProgress}>
							{cleanupInProgress ? 'Cleaning...' : 'Clean Nutrition'}
						</button>
					{:else if recipeUid}
						<a href={`/recipe/${recipeUid}/edit/`} class="btn btn-soft btn-secondary btn-xs">
							Clean Nutrition in Edit
						</a>
					{/if}
				</div>
			{/if}
			<div class="prose max-w-none">
				{#each nutritionalInfo.split('\n') as line}
					{#if line.trim()}
						<p>{line}</p>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
{/if}
