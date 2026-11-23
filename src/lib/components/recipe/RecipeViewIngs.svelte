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
	import { formatIngredientAmount, normalizeScale } from '$lib/utils/ingredientAmount'
	import { shoppingItemFromIngredient } from '$lib/utils/shopping'
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

	// "Add all to shopping list": a checklist of the recipe's ingredients, scaled and in the
	// selected unit system, so the user can untick what they already have
	let isAddAllOpen = $state(false)
	let addAllSelected = $state(/** @type {boolean[]} */ ([]))
	let addAllSaving = $state(false)
	let addAllFeedbackCode = $state(/** @type {string|null} */ (null))
	let addAllFeedbackVars = $state({})

	const isHeadingLine = (/** @type {any} */ ing) =>
		/^\s*#{1,6}\s+/.test(ing?.originalString ?? ing?.ingredient ?? '')

	const addAllCandidates = $derived(
		sanitizedIngredients.filter((ing) => ing?.ingredient?.trim() && !isHeadingLine(ing))
	)

	const amountFor = (/** @type {any} */ ing) =>
		formatIngredientAmount(ing, {
			scale: normalizeScale(scale),
			system: selectedSystem,
			useSymbol: user?.ingSymbol,
			lang: user?.language || 'eng'
		})

	function openAddAll() {
		addAllSelected = addAllCandidates.map((ing) => !ing.optional)
		addAllFeedbackCode = null
		addAllFeedbackVars = {}
		isAddAllOpen = true
	}

	async function confirmAddAll() {
		const scaleValue = normalizeScale(scale)
		const items = addAllCandidates
			.filter((_, index) => addAllSelected[index])
			.map((ing) => shoppingItemFromIngredient(ing, scaleValue, recipeUid))
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
	<h3 class="text-2xl font-bold mb-4">{$t('recipeView.ingredients')}</h3>

	{#if ingredients.length > 0}
		{#if sanitizedIngredients.some((item) => item.ingredient)}
			<div class="mb-4">
				<Scale {scale} {onScaleChange} {baseServings} />
			</div>
			{#if user?.userId && addAllCandidates.length > 0}
				<div class="mb-4">
					<Button style="soft" color="primary" size="sm" onclick={openAddAll}>
						<Shopping width="14px" fill="currentColor" />
						{$t('recipeView.addAllToShopping')}
					</Button>
					{#if !isAddAllOpen}
						<FeedbackMessage messageCode={addAllFeedbackCode} messageVars={addAllFeedbackVars} />
					{/if}
				</div>
			{/if}
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
		<ul class="space-y-1 max-h-[60vh] overflow-y-auto">
			{#each addAllCandidates as ing, index (index)}
				<li>
					<Checkbox
						bind:checked={addAllSelected[index]}
						name={`add-all-${index}`}
						color="primary"
						size="sm"
						fullWidth={false}>
						<span>
							{#if amountFor(ing)}
								<span class="font-semibold">{amountFor(ing)}</span>
							{/if}
							{ing.ingredient}
						</span>
					</Checkbox>
				</li>
			{/each}
		</ul>
		{#if isAddAllOpen && addAllFeedbackCode}
			<FeedbackMessage messageCode={addAllFeedbackCode} messageVars={addAllFeedbackVars} />
		{/if}
		<div class="modal-action">
			<Button style="outline" onclick={() => (isAddAllOpen = false)}>{$t('common.cancel')}</Button>
			<Button disabled={addAllSaving || !addAllSelected.some(Boolean)} onclick={confirmAddAll}>
				{$t('recipeView.addSelectedToShopping', {
					count: addAllSelected.filter(Boolean).length
				})}
			</Button>
		</div>
	</Dialog>
{/if}
