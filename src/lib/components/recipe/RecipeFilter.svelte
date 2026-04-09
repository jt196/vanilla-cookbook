<script>
	import SortAscDesc from '$lib/components/svg/SortAscDesc.svelte'
	import Favourite from '$lib/components/svg/Favourite.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import Settings from '$lib/components/svg/Settings.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Spinner from '$lib/components/ui/Spinner.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import {
		sortState,
		searchString,
		searchFields,
		cookedFilter,
		favouriteFilter
	} from '$lib/stores/recipeFilter'
	import { t } from '$lib/stores/locale.js'

	let {
		viewOnly,
		username,
		viewMode = 'owner',
		searchPending = false
	} = $props()

	const favouriteBtnClasses = $derived(
		['tooltip', $favouriteFilter ? 'opacity-100 text-error' : 'opacity-60', 'hover:opacity-100']
			.filter(Boolean)
			.join(' ')
	)

	const cookedBtnClasses = $derived(
		['tooltip', $cookedFilter ? 'opacity-100 text-success' : 'opacity-60', 'hover:opacity-100']
			.filter(Boolean)
			.join(' ')
	)

	function updateSort(key) {
		sortState.update((current) => {
			// 3-state cycle per key:
			// unselected -> desc -> asc -> unselected
			if (current.key !== key || !current.direction) {
				return { key, direction: 'desc' }
			}
			if (current.direction === 'desc') {
				return { key, direction: 'asc' }
			}
			return { key: null, direction: null }
		})
	}

	function toggleSearchField(field) {
		searchFields.update((fields) => {
			if (fields.includes(field)) return fields.filter((f) => f !== field)
			return [...fields, field]
		})
	}

	function hasField(field) {
		return $searchFields.includes(field)
	}

	function clearSearch() {
		$searchString = ''
	}
</script>

{#if viewOnly}
	<div class="mb-2 md:mb-4 prose max-w-none flex justify-center">
		<h2>{$t('nav.cookbook', { username })}</h2>
	</div>
{/if}
<div class="flex flex-col gap-1 md:gap-3 py-1 md:py-4">
	<div class="flex flex-wrap md:flex-nowrap items-center gap-1 overflow-visible">
		<div class="flex-1 min-w-0 relative">
			<Input
				type="text"
				name="search"
				placeholder={$t('filter.placeholder')}
				bind:value={$searchString}
				size="md"
				color="info"
				class="pr-10"
				useLabelAsPlaceholder={false}
			/>
			{#if searchPending && $searchString?.trim()}
				<Spinner
					visible={true}
					inline={true}
					size="xs"
					color="info"
					spinnerContent={$t('filter.searching')}
					inlineClass="absolute right-3 top-1/2 -translate-y-1/2"
				/>
			{:else if $searchString?.trim()}
				<Button
					type="button"
					size="xs"
					style="ghost"
					color="info"
					class="btn-circle absolute right-2 top-1/2 -translate-y-1/2"
					onclick={clearSearch}
					aria-label={$t('filter.clearSearch')}
				>
					×
				</Button>
			{/if}
		</div>

		<DropdownMenu
			align="end"
			summaryClass="btn btn-md btn-outline btn-info shrink-0"
			summaryAriaLabel={$t('filter.searchFields')}
			contentClass="menu dropdown-content bg-base-100 rounded-box z-50 w-56 p-3 shadow-sm"
		>
			{#snippet trigger()}
				<Settings width="16px" height="16px" />
				{#if $searchFields.length > 0}
					<span class="badge badge-info badge-xs">{$searchFields.length}</span>
				{/if}
			{/snippet}
			{#snippet children()}
				<Checkbox
					checked={hasField('name')}
					onchange={() => toggleSearchField('name')}
					color="info"
					size="sm"
					class="mb-1"
					fullWidth={false}
				>
					{$t('filter.fieldName')}
				</Checkbox>
				<Checkbox
					checked={hasField('ingredients')}
					onchange={() => toggleSearchField('ingredients')}
					color="info"
					size="sm"
					class="mb-1"
					fullWidth={false}
				>
					{$t('filter.fieldIngredients')}
				</Checkbox>
				<Checkbox
					checked={hasField('source')}
					onchange={() => toggleSearchField('source')}
					color="info"
					size="sm"
					class="mb-1"
					fullWidth={false}
				>
					{$t('filter.fieldSource')}
				</Checkbox>
				<Checkbox
					checked={hasField('notes')}
					onchange={() => toggleSearchField('notes')}
					color="info"
					size="sm"
					fullWidth={false}
				>
					{$t('filter.fieldNotes')}
				</Checkbox>
			{/snippet}
		</DropdownMenu>

		<Button
			style="outline"
			size="md"
			color="secondary"
			onclick={() => ($favouriteFilter = !$favouriteFilter)}
			class={`btn-square shrink-0 ${favouriteBtnClasses}`}
			data-tip={$t('filter.filterFavourites')}
		>
			<Favourite favourite={$favouriteFilter} width="20px" height="20px" fill="currentColor" />
		</Button>

		{#if viewMode === 'owner'}
			<Button
				style="outline"
				size="md"
				color="success"
				onclick={() => ($cookedFilter = !$cookedFilter)}
				class={`btn-square shrink-0 ${cookedBtnClasses}`}
				data-tip={$t('filter.filterCooked')}
			>
				<Check checked={$cookedFilter} width="20px" height="20px" fill="currentColor" />
			</Button>
		{/if}

		<DropdownMenu
			align="end"
			summaryClass="btn btn-md btn-outline btn-info shrink-0"
			summaryAriaLabel={$t('filter.sortOptions')}
			contentClass="menu dropdown-content bg-base-100 rounded-box z-50 w-48 p-2 shadow-sm"
		>
			{#snippet trigger()}
				<SortAscDesc
					sort={$sortState.direction}
					propClass="h-4 w-4 fill-current text-info-content"
				/>
			{/snippet}
			{#snippet children()}
				<Button
					type="button"
					style={$sortState.key === 'created' && !!$sortState.direction ? 'standard' : 'ghost'}
					class="justify-between"
					size="sm"
					color="info"
					onclick={() => updateSort('created')}
				>
					{$t('filter.sortAdded')}
					<SortAscDesc sort={$sortState.key === 'created' ? $sortState.direction : null} />
				</Button>
				<Button
					type="button"
					style={$sortState.key === 'name' && !!$sortState.direction ? 'standard' : 'ghost'}
					class="justify-between"
					size="sm"
					color="info"
					onclick={() => updateSort('name')}
				>
					{$t('filter.sortTitle')}
					<SortAscDesc sort={$sortState.key === 'name' ? $sortState.direction : null} />
				</Button>
				{#if viewMode === 'owner'}
					<Button
						type="button"
						style={$sortState.key === 'rating' && !!$sortState.direction ? 'standard' : 'ghost'}
						class="justify-between"
						size="sm"
						color="info"
						onclick={() => updateSort('rating')}
					>
						{$t('filter.sortRating')}
						<SortAscDesc sort={$sortState.key === 'rating' ? $sortState.direction : null} />
					</Button>
					<Button
						type="button"
						style={$sortState.key === 'lastCooked' && !!$sortState.direction
							? 'standard'
							: 'ghost'}
						class="justify-between"
						size="sm"
						color="info"
						onclick={() => updateSort('lastCooked')}
					>
						{$t('filter.sortCooked')}
						<SortAscDesc sort={$sortState.key === 'lastCooked' ? $sortState.direction : null} />
					</Button>
				{/if}
			{/snippet}
		</DropdownMenu>
	</div>
</div>
