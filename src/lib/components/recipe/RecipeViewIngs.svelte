<script>
	import { untrack } from 'svelte'
	import Scale from '$lib/components/ui/Scale.svelte'
	import RecipeViewIng from '$lib/components/recipe/RecipeViewIng.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Badge from '$lib/components/ui/Badge.svelte'
	import { i18nMap } from '$lib/submodules/recipe-ingredient-parser/src/i18n'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import Shopping from '$lib/components/svg/Shopping.svelte'
	import { addIngredientsToShoppingList } from '$lib/utils/crud'
	import { normalizeScale } from '$lib/utils/ingredientAmount'
	import { shoppingItemFromIngredient, shoppingUnitLabel } from '$lib/utils/shopping'
	import { t } from '$lib/stores/locale.js'

	/** @type {{ingredients: any, sanitizedIngredients: any, scale: any, selectedSystem: any, measurementSystem: any, recipeUid: any, user: any, onScaleChange?: (scale: number) => void, onSelectedSystemChange?: (system: string) => void, baseServings?: number }} */
	let {
		ingredients,
		sanitizedIngredients,
		onScaleChange,
		onSelectedSystemChange,
		measurementSystem,
		recipeUid,
		scale,
		selectedSystem,
		user,
		baseServings = 1
	} = $props()

	let displayExtra = $state(untrack(() => user.ingExtra))
	let displayDryMatch = $state(untrack(() => user.ingMatch))
	let displayOriginal = $state(untrack(() => user.ingOriginal))

	let hasDefaultDensity = $derived(sanitizedIngredients.some((i) => i.usedDefaultDensity === true))

	const originalSystem = $derived(measurementSystem?.system || null)
	const isVolumetricConversion = $derived(
		(originalSystem === 'americanVolumetric' &&
			(selectedSystem === 'metric' || selectedSystem === 'imperial')) ||
			(selectedSystem === 'americanVolumetric' &&
				(originalSystem === 'metric' || originalSystem === 'imperial'))
	)

	// Determine which badges are actually used in the ingredients
	const hasApprox = $derived(sanitizedIngredients.some((i) => i.approx))
	const hasOptional = $derived(sanitizedIngredients.some((i) => i.optional))
	const hasToServe = $derived(sanitizedIngredients.some((i) => i.toServe))
	const hasToTaste = $derived(sanitizedIngredients.some((i) => i.toTaste))

	const badgeLabels = $derived.by(() => {
		const langData = i18nMap[user?.language] ?? i18nMap.eng
		return langData.badgeLabels ?? i18nMap.eng.badgeLabels
	})

	// Shopping overlay: the recipe's ingredients, scaled and in the selected unit system, with
	// editable amounts, so the user picks what to add and how much
	/** @typedef {{ selected: boolean, name: string, quantity: string, unit: string }} ShoppingRow */
	let isAddAllOpen = $state(false)
	let addAllRows = $state(/** @type {ShoppingRow[]} */ ([]))
	let addAllSaving = $state(false)
	let addAllFeedbackCode = $state(/** @type {string|null} */ (null))
	let addAllFeedbackVars = $state({})

	const isHeadingLine = (/** @type {any} */ ing) =>
		/^\s*#{1,6}\s+/.test(ing?.originalString ?? ing?.ingredient ?? '')

	const addAllCandidates = $derived(
		sanitizedIngredients.filter((ing) => ing?.ingredient?.trim() && !isHeadingLine(ing))
	)

	const selectedCount = $derived(addAllRows.filter((row) => row.selected).length)
	const allSelected = $derived(addAllRows.length > 0 && selectedCount === addAllRows.length)

	function openAddAll() {
		const scaleValue = normalizeScale(scale)
		const lang = user?.language || 'eng'
		addAllRows = addAllCandidates.map((ing) => {
			const item = shoppingItemFromIngredient(ing, scaleValue)
			return {
				selected: !ing.optional,
				name: item.ingredient,
				quantity: item.quantity === null ? '' : String(item.quantity),
				unit: shoppingUnitLabel(item.unit, item.quantity, lang)
			}
		})
		addAllFeedbackCode = null
		addAllFeedbackVars = {}
		isAddAllOpen = true
	}

	function toggleAll() {
		const select = !allSelected
		addAllRows = addAllRows.map((row) => ({ ...row, selected: select }))
	}

	async function confirmAddAll() {
		const items = addAllRows
			.filter((row) => row.selected && row.name.trim())
			.map((row) => ({
				ingredient: row.name.trim(),
				quantity: row.quantity.trim() === '' ? null : row.quantity.trim().replace(',', '.'),
				unit: row.unit.trim() || null,
				recipeUid
			}))
		if (items.length === 0) {
			isAddAllOpen = false
			return
		}
		addAllSaving = true
		const response = await addIngredientsToShoppingList(items)
		addAllSaving = false
		if (response.success) {
			isAddAllOpen = false
			addAllFeedbackCode = response.data?.code ?? 'shopping.msg.itemsAdded_other'
			addAllFeedbackVars = response.data?.vars ?? { count: items.length }
		} else {
			addAllFeedbackCode = response.code || 'shopping.msg.itemAddFail'
			addAllFeedbackVars = {}
		}
	}
</script>

<div>
	<div class="flex items-center justify-between gap-2 mb-4">
		<h3 class="text-2xl font-bold">{$t('recipeView.ingredients')}</h3>
		{#if user?.userId && addAllCandidates.length > 0}
			<Button
				style="ghost"
				color="primary"
				size="sm"
				class="btn-circle tooltip tooltip-left"
				data-tip={$t('recipeView.addAllToShopping')}
				aria-label={$t('recipeView.addAllToShopping')}
				onclick={openAddAll}>
				<Shopping width="20px" fill="currentColor" />
			</Button>
		{/if}
	</div>
	{#if !isAddAllOpen && addAllFeedbackCode}
		<FeedbackMessage messageCode={addAllFeedbackCode} messageVars={addAllFeedbackVars} />
	{/if}

	{#if ingredients.length > 0}
		{#if sanitizedIngredients.some((item) => item.ingredient)}
			<div class="mb-4">
				<Scale {scale} {onScaleChange} {baseServings} />
			</div>
		{/if}
	{:else}
		<p class="text-base-content/70">{$t('recipeView.loading')}</p>
	{/if}

	<ul class="pl-0 mb-4 space-y-1">
		{#each sanitizedIngredients as ingredient, ingredientIndex (ingredientIndex)}
			<RecipeViewIng
				{ingredient}
				{ingredientIndex}
				{recipeUid}
				{scale}
				{displayExtra}
				displaySymbol={user.ingSymbol}
				{displayDryMatch}
				{displayOriginal}
				{selectedSystem}
				userLanguage={user?.language || 'eng'} />
		{/each}
	</ul>

	{#if hasDefaultDensity}
		<p class="text-sm italic text-base-content/60 my-2">{$t('recipeView.defaultDensity')}</p>
	{/if}

	{#if hasApprox || hasOptional || hasToServe || hasToTaste}
		<div class="flex flex-wrap gap-3 text-sm text-base-content/60 my-4">
			{#if hasApprox}
				<span>
					<Badge color="secondary" style="outline" title={badgeLabels.approx.title}>
						{badgeLabels.approx.short}
					</Badge>
					{badgeLabels.approx.label}
				</span>
			{/if}
			{#if hasOptional}
				<span>
					<Badge color="secondary" style="outline" title={badgeLabels.optional.title}>
						{badgeLabels.optional.short}
					</Badge>
					{badgeLabels.optional.label}
				</span>
			{/if}
			{#if hasToServe}
				<span>
					<Badge color="secondary" style="outline" title={badgeLabels.toServe.title}>
						{badgeLabels.toServe.short}
					</Badge>
					{badgeLabels.toServe.label}
				</span>
			{/if}
			{#if hasToTaste}
				<span>
					<Badge color="secondary" style="outline" title={badgeLabels.toTaste.title}>
						{badgeLabels.toTaste.short}
					</Badge>
					{badgeLabels.toTaste.label}
				</span>
			{/if}
		</div>
	{/if}

	{#if user.showUnitButtons !== false}
		<div class="mb-4">
			<div class="grid grid-cols-3 gap-1 mb-3">
				<Button
					style={selectedSystem === 'metric' ? 'standard' : 'soft'}
					color="primary"
					size="sm"
					class={originalSystem === 'metric' ? 'ring-2 ring-primary' : ''}
					onclick={() => onSelectedSystemChange('metric')}>
					{$t('recipeView.systemMetric')}
				</Button>
				<Button
					style={selectedSystem === 'americanVolumetric' ? 'standard' : 'soft'}
					color="primary"
					size="sm"
					class={originalSystem === 'americanVolumetric' ? 'ring-2 ring-primary' : ''}
					onclick={() => onSelectedSystemChange('americanVolumetric')}>
					{$t('recipeView.systemUsVol')}
				</Button>
				<Button
					style={selectedSystem === 'imperial' ? 'standard' : 'soft'}
					color="primary"
					size="sm"
					class={originalSystem === 'imperial' ? 'ring-2 ring-primary' : ''}
					onclick={() => onSelectedSystemChange('imperial')}>
					{$t('recipeView.systemImperial')}
				</Button>
			</div>
		</div>
	{/if}

	{#if user.showDisplayToggles !== false}
		<div class="flex flex-wrap gap-1">
			<Button
				style={displayOriginal ? 'standard' : 'soft'}
				color="primary"
				size="sm"
				class="flex-1"
				onclick={() => (displayOriginal = !displayOriginal)}>
				{$t('recipeView.toggleOriginal')}
			</Button>
			{#if sanitizedIngredients.some((item) => item.additional)}
				<Button
					style={displayExtra ? 'standard' : 'soft'}
					color="primary"
					size="sm"
					class="flex-1"
					disabled={displayOriginal}
					onclick={() => (displayExtra = !displayExtra)}>
					{$t('recipeView.toggleExtra')}
				</Button>
			{/if}
			<Button
				style={displayDryMatch ? 'standard' : 'soft'}
				color="primary"
				size="sm"
				class="flex-1"
				disabled={displayOriginal || !isVolumetricConversion}
				onclick={() => (displayDryMatch = !displayDryMatch)}>
				{$t('recipeView.toggleMatch')}
			</Button>
		</div>
	{/if}
</div>

{#if isAddAllOpen}
	<Dialog bind:isOpen={isAddAllOpen}>
		<h3 class="font-bold text-lg">{$t('recipeView.addAllToShopping')}</h3>
		<p class="text-sm opacity-70 mb-3">{$t('recipeView.addAllHint')}</p>
		<Checkbox
			checked={allSelected}
			name="add-all-toggle"
			color="primary"
			size="sm"
			class="mb-2 font-semibold"
			onchange={toggleAll}>
			{$t('recipeView.selectAll')}
		</Checkbox>
		<ul class="space-y-2 max-h-[60vh] overflow-y-auto">
			{#each addAllRows as row, index (index)}
				<li class="flex items-center gap-2">
					<input
						type="checkbox"
						class="checkbox checkbox-primary checkbox-sm"
						aria-label={row.name}
						bind:checked={row.selected} />
					<span class={`flex-1 min-w-0 break-words ${row.selected ? '' : 'opacity-50'}`}>
						{row.name}
					</span>
					<input
						type="text"
						inputmode="decimal"
						class="input input-sm w-16 shrink-0"
						aria-label={$t('shopping.quantity')}
						disabled={!row.selected}
						bind:value={row.quantity} />
					<input
						type="text"
						class="input input-sm w-20 shrink-0"
						aria-label={$t('shopping.unit')}
						disabled={!row.selected}
						bind:value={row.unit} />
				</li>
			{/each}
		</ul>
		{#if addAllFeedbackCode}
			<FeedbackMessage messageCode={addAllFeedbackCode} messageVars={addAllFeedbackVars} />
		{/if}
		<div class="modal-action">
			<Button style="outline" onclick={() => (isAddAllOpen = false)}>{$t('common.cancel')}</Button>
			<Button disabled={addAllSaving || selectedCount === 0} onclick={confirmAddAll}>
				{$t('recipeView.addSelectedToShopping', { count: selectedCount })}
			</Button>
		</div>
	</Dialog>
{/if}
