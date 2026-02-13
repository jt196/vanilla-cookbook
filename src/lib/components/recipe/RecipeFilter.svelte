<script>
	import SortAscDesc from '$lib/components/svg/SortAscDesc.svelte'
	import Favourite from '$lib/components/svg/Favourite.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import Burger from '$lib/components/svg/Burger.svelte'
	import Settings from '$lib/components/svg/Settings.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import {
		sortState,
		searchString,
		searchFields,
		cookedFilter,
		favouriteFilter
	} from '$lib/stores/recipeFilter'

	let { toggleSidebar, viewOnly, useCats = 'false', username, viewMode = 'owner' } = $props()

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
</script>

{#if viewOnly}
	<div class="mb-4 prose max-w-none flex justify-center">
		<h2>{username}'s Cookbook</h2>
	</div>
{/if}
<div class="flex flex-col gap-3 py-4">
	<!-- Desktop: Single row, Mobile: Two rows -->
	<div class="flex flex-col md:flex-row items-stretch md:items-center gap-2">
		<!-- Row 1 on mobile: Search bar + Select + Category button -->
		<div class="flex items-center gap-2 flex-1">
			{#if useCats}
				<Button
					style="ghost"
					size="md"
					class="btn-square tooltip shrink-0"
					data-tip="Display Category Filter"
					onclick={toggleSidebar}>
					<Burger width="1.25rem" />
				</Button>
			{/if}
			<div class="flex-1 min-w-0">
				<Input
					type="text"
					name="search"
					placeholder="Search recipes by..."
					bind:value={$searchString}
					size="sm"
					color="info"
					useLabelAsPlaceholder={false} />
			</div>
			<div class="flex items-center gap-1 shrink-0">
				<DropdownMenu
					align="end"
					summaryClass="btn btn-sm btn-outline btn-info"
					summaryAriaLabel="Search fields"
					contentClass="menu dropdown-content bg-base-100 rounded-box z-[1] w-56 p-3 shadow-sm">
					{#snippet trigger()}
						<Settings width="14px" height="14px" />
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
							fullWidth={false}>
							Name
						</Checkbox>
						<Checkbox
							checked={hasField('ingredients')}
							onchange={() => toggleSearchField('ingredients')}
							color="info"
							size="sm"
							class="mb-1"
							fullWidth={false}>
							Ingredients
						</Checkbox>
						<Checkbox
							checked={hasField('source')}
							onchange={() => toggleSearchField('source')}
							color="info"
							size="sm"
							class="mb-1"
							fullWidth={false}>
							Source
						</Checkbox>
						<Checkbox
							checked={hasField('notes')}
							onchange={() => toggleSearchField('notes')}
							color="info"
							size="sm"
							fullWidth={false}>
							Notes
						</Checkbox>
					{/snippet}
				</DropdownMenu>
			</div>
		</div>

		<!-- Row 2 on mobile: Filter + Sort buttons -->
		<div class="flex items-center gap-2 justify-between md:justify-end">
			<!-- Filter buttons -->
			<div class="flex items-center gap-1">
				<Button
					style="outline"
					size="sm"
					color="secondary"
					onclick={() => ($favouriteFilter = !$favouriteFilter)}
					class={`btn-square ${favouriteBtnClasses}`}
					data-tip="Filter by Favourites">
					<Favourite favourite={$favouriteFilter} width="20px" height="20px" fill="currentColor" />
				</Button>
				{#if viewMode === 'owner'}
					<Button
						style="outline"
						size="sm"
						color="success"
						onclick={() => ($cookedFilter = !$cookedFilter)}
						class={`btn-square ${cookedBtnClasses}`}
						data-tip="Filter by Cooked">
						<Check checked={$cookedFilter} width="20px" height="20px" fill="currentColor" />
					</Button>
				{/if}
			</div>

			<div class="flex gap-1">
				<DropdownMenu
					align="end"
					summaryClass="btn btn-sm btn-outline btn-info"
					summaryAriaLabel="Sort options"
					contentClass="menu dropdown-content bg-base-100 rounded-box z-[1] w-48 p-2 shadow-sm">
					{#snippet trigger()}
						<SortAscDesc
							sort={$sortState.direction}
							propClass="h-4 w-4 fill-current text-info-content" />
					{/snippet}
					{#snippet children()}
						<Button
							type="button"
							style={$sortState.key === 'created' && !!$sortState.direction ? 'standard' : 'ghost'}
							class="justify-between"
							size="sm"
							color="info"
							onclick={() => updateSort('created')}>
							Date
							<SortAscDesc sort={$sortState.key === 'created' ? $sortState.direction : null} />
						</Button>
						<Button
							type="button"
							style={$sortState.key === 'name' && !!$sortState.direction ? 'standard' : 'ghost'}
							class="justify-between"
							size="sm"
							color="info"
							onclick={() => updateSort('name')}>
							Title
							<SortAscDesc sort={$sortState.key === 'name' ? $sortState.direction : null} />
						</Button>
						{#if viewMode === 'owner'}
							<Button
								type="button"
								style={$sortState.key === 'rating' && !!$sortState.direction ? 'standard' : 'ghost'}
								class="justify-between"
								size="sm"
								color="info"
								onclick={() => updateSort('rating')}>
								Rating
								<SortAscDesc sort={$sortState.key === 'rating' ? $sortState.direction : null} />
							</Button>
						{/if}
					{/snippet}
				</DropdownMenu>
			</div>
		</div>
	</div>
</div>
