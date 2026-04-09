<script>
	import Table from '$lib/components/ui/Table/Table.svelte'
	import TableHead from '$lib/components/ui/Table/TableHead.svelte'
	import TableBody from '$lib/components/ui/Table/TableBody.svelte'
	import TableRow from '$lib/components/ui/Table/TableRow.svelte'
	import TableCell from '$lib/components/ui/Table/TableCell.svelte'
	import { parseNutritionInfo, scaleNutrition } from '$lib/utils/nutrition'
	import { t } from '$lib/stores/locale.js'

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
			? $t('nutritionView.perServing')
			: scale !== 1
				? $t('nutritionView.perRecipeScaled', { scale })
				: $t('nutritionView.perRecipe')
	)
</script>

{#if nutritionalInfo && nutritionalInfo.trim()}
	<div class="mt-6">
		<h3 class="text-2xl font-bold mb-2">{$t('nutritionView.title')}</h3>
		<p class="text-sm text-base-content/70 mb-3">{statusText}</p>

		{#if canShowTable}
			<Table size="sm" bordered containerClass="max-w-full">
				<TableHead>
					<TableRow>
						<TableCell tag="th" scope="col">{$t('nutritionView.nutrient')}</TableCell>
						<TableCell tag="th" scope="col">{$t('nutritionView.amount')}</TableCell>
						{#if hasNotes}
							<TableCell tag="th" scope="col">{$t('nutritionView.note')}</TableCell>
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
									: entry.raw}</TableCell
							>
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
							disabled={cleanupInProgress}
						>
							{cleanupInProgress ? $t('recipeForm.cleaning') : $t('recipeForm.cleanNutrition')}
						</button>
					{:else if recipeUid}
						<a href={`/recipe/${recipeUid}/edit/`} class="btn btn-soft btn-secondary btn-xs">
							{$t('nutritionView.cleanInEdit')}
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
