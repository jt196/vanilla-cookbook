<script>
	import SortAscDesc from '$lib/components/svg/SortAscDesc.svelte'
	import Favourite from '$lib/components/svg/Favourite.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import Burger from '$lib/components/svg/Burger.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Dropdown from '$lib/components/ui/Form/Dropdown.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import {
		sortState,
		searchString,
		searchKey,
		cookedFilter,
		favouriteFilter
	} from '$lib/stores/recipeFilter'

	let { toggleSidebar, viewOnly, useCats = 'false', username } = $props()

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
			// Toggle direction if the same key is clicked again, otherwise set to 'asc'
			const direction = current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
			return { key, direction }
		})
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
			<div class="tooltip shrink-0" data-tip="Choose Search Key">
				<Dropdown
					name="selections"
					bind:selected={$searchKey}
					options={[
						{ value: 'name', label: 'Name' },
						{ value: 'ingredients', label: 'Ingredients' },
						{ value: 'source', label: 'Source' },
						{ value: 'notes', label: 'Notes' }
					]}
					size="sm"
					color="info"
					fullWidth={false}
					class="w-35"
					aria-label="selections" />
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
				<Button
					style="outline"
					size="sm"
					color="success"
					onclick={() => ($cookedFilter = !$cookedFilter)}
					class={`btn-square ${cookedBtnClasses}`}
					data-tip="Filter by Cooked">
					<Check checked={$cookedFilter} width="20px" height="20px" fill="currentColor" />
				</Button>
			</div>

			<!-- Sort buttons -->
			<div class="flex gap-1">
				<Button
					style={$sortState.key === 'created' ? 'standard' : 'outline'}
					class="tooltip px-2 text-xs"
					size="sm"
					color="info"
					data-tip="Sort by Date"
					onclick={() => updateSort('created')}>
					Date <SortAscDesc sort={$sortState.key === 'created' ? $sortState.direction : ''} />
				</Button>
				<Button
					style={$sortState.key === 'name' ? 'standard' : 'outline'}
					class="tooltip px-2 text-xs"
					size="sm"
					color="info"
					data-tip="Sort by Name"
					onclick={() => updateSort('name')}>
					Title <SortAscDesc sort={$sortState.key === 'name' ? $sortState.direction : ''} />
				</Button>
				<Button
					style={$sortState.key === 'rating' ? 'standard' : 'outline'}
					class="tooltip px-2 text-xs"
					size="sm"
					color="info"
					data-tip="Sort by Rating"
					onclick={() => updateSort('rating')}>
					Rating <SortAscDesc sort={$sortState.key === 'rating' ? $sortState.direction : ''} />
				</Button>
			</div>
		</div>
	</div>
</div>
