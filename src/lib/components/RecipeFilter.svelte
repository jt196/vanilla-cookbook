<script>
	import SortAscDesc from '$lib/components/svg/SortAscDesc.svelte'
	import Favourite from '$lib/components/svg/Favourite.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import Burger from '$lib/components/svg/Burger.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Select from '$lib/components/ui/Form/Select.svelte'
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
<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between py-4">
	<div class="flex flex-1 items-center gap-2 min-w-0 md:min-w-[400px]">
		{#if useCats}
			<Button
				style="ghost"
				size="lg"
				class="btn-square tooltip"
				data-tip="Display Category Filter"
				onclick={toggleSidebar}>
				<Burger width="1.5rem" />
			</Button>
		{/if}
		<div class="flex-1">
			<Input
				type="text"
				name="search"
				placeholder="Search recipes by..."
				bind:value={$searchString}
				size="lg"
				color="info"
				useLabelAsPlaceholder={false} />
		</div>
		<div class="tooltip" data-tip="Choose Search Key">
			<Select
				name="selections"
				bind:value={$searchKey}
				id="selections"
				options={[
					{ value: 'name', label: 'Name' },
					{ value: 'ingredients', label: 'Ingredients' },
					{ value: 'source', label: 'Source' },
					{ value: 'notes', label: 'Notes' }
				]}
				size="lg"
				color="info"
				style="standard"
				fullWidth={false}
				class="min-w-[150px]"
				aria-label="selections" />
		</div>
	</div>
	<div class="flex flex-col gap-2 w-full md:flex-row md:items-center md:justify-end">
		<div class="flex justify-center gap-2 md:justify-start">
			<Button
				style="outline"
				size="lg"
				color="secondary"
				onclick={() => ($favouriteFilter = !$favouriteFilter)}
				class={`w-auto px-2 ${favouriteBtnClasses}`}
				data-tip="Filter by Favourites">
				<Favourite favourite={$favouriteFilter} width="24px" height="24px" fill="currentColor" />
			</Button>
			<Button
				style="outline"
				size="lg"
				color="success"
				onclick={() => ($cookedFilter = !$cookedFilter)}
				class={`w-auto px-2 ${cookedBtnClasses}`}
				data-tip="Filter by Cooked">
				<Check checked={$cookedFilter} width="24px" height="24px" fill="currentColor" />
			</Button>
		</div>
		<div class="flex gap-2 flex-wrap justify-between md:justify-start">
			<Button
				style={$sortState.key === 'created' ? 'standard' : 'outline'}
				class="tooltip flex-1 min-w-[90px] px-2 text-sm md:flex-none"
				size="lg"
				color="info"
				data-tip="Sort by Date"
				onclick={() => updateSort('created')}>
				Date <SortAscDesc sort={$sortState.key === 'created' ? $sortState.direction : ''} />
			</Button>
			<Button
				style={$sortState.key === 'name' ? 'standard' : 'outline'}
				class="tooltip flex-1 min-w-[90px] px-2 text-sm md:flex-none"
				size="lg"
				color="info"
				data-tip="Sort by Name"
				onclick={() => updateSort('name')}>
				Title <SortAscDesc sort={$sortState.key === 'name' ? $sortState.direction : ''} />
			</Button>
			<Button
				style={$sortState.key === 'rating' ? 'standard' : 'outline'}
				class="tooltip flex-1 min-w-[90px] px-2 text-sm md:flex-none"
				size="lg"
				color="info"
				data-tip="Sort by Rating"
				onclick={() => updateSort('rating')}>
				Rating <SortAscDesc sort={$sortState.key === 'rating' ? $sortState.direction : ''} />
			</Button>
		</div>
	</div>
</div>
