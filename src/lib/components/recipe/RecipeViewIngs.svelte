<script>
	import Scale from '$lib/components/ui/Scale.svelte'
	import RecipeViewIng from '$lib/components/recipe/RecipeViewIng.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Badge from '$lib/components/ui/Badge.svelte'
	import { i18nMap } from '$lib/submodules/recipe-ingredient-parser/src/i18n'
	import { t } from '$lib/stores/locale.js'

	/** @type {{ingredients: any, sanitizedIngredients: any, scale: any, scaledServings: any, selectedSystem: any, measurementSystem: any, recipeUid: any, baseServings?: number }} */
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

	let displayExtra = $state(user.ingExtra)
	let displayDryMatch = $state(user.ingMatch)
	let displayOriginal = $state(user.ingOriginal)

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
</script>

<div>
	<h3 class="text-2xl font-bold mb-4">{$t('recipeView.ingredients')}</h3>

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
		{#each sanitizedIngredients as ingredient, ingredientIndex}
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
				userLanguage={user?.language || 'eng'}
			/>
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

	<div class="mb-4">
		<div class="grid grid-cols-3 gap-1 mb-3">
			<Button
				style={selectedSystem === 'metric' ? 'standard' : 'soft'}
				color="primary"
				size="sm"
				class={originalSystem === 'metric' ? 'ring-2 ring-primary' : ''}
				onclick={() => onSelectedSystemChange('metric')}
			>
				{$t('recipeView.systemMetric')}
			</Button>
			<Button
				style={selectedSystem === 'americanVolumetric' ? 'standard' : 'soft'}
				color="primary"
				size="sm"
				class={originalSystem === 'americanVolumetric' ? 'ring-2 ring-primary' : ''}
				onclick={() => onSelectedSystemChange('americanVolumetric')}
			>
				{$t('recipeView.systemUsVol')}
			</Button>
			<Button
				style={selectedSystem === 'imperial' ? 'standard' : 'soft'}
				color="primary"
				size="sm"
				class={originalSystem === 'imperial' ? 'ring-2 ring-primary' : ''}
				onclick={() => onSelectedSystemChange('imperial')}
			>
				{$t('recipeView.systemImperial')}
			</Button>
		</div>
	</div>

	<div class="flex flex-wrap gap-1">
		<Button
			style={displayOriginal ? 'standard' : 'soft'}
			color="primary"
			size="sm"
			class="flex-1"
			onclick={() => (displayOriginal = !displayOriginal)}
		>
			{$t('recipeView.toggleOriginal')}
		</Button>
		{#if sanitizedIngredients.some((item) => item.additional)}
			<Button
				style={displayExtra ? 'standard' : 'soft'}
				color="primary"
				size="sm"
				class="flex-1"
				disabled={displayOriginal}
				onclick={() => (displayExtra = !displayExtra)}
			>
				{$t('recipeView.toggleExtra')}
			</Button>
		{/if}
		<Button
			style={displayDryMatch ? 'standard' : 'soft'}
			color="primary"
			size="sm"
			class="flex-1"
			disabled={displayOriginal || !isVolumetricConversion}
			onclick={() => (displayDryMatch = !displayDryMatch)}
		>
			{$t('recipeView.toggleMatch')}
		</Button>
	</div>
</div>
