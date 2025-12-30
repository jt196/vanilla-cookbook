<script>
	import SortAscDesc from '$lib/components/svg/SortAscDesc.svelte'
	import Favourite from '$lib/components/svg/Favourite.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import Burger from '$lib/components/svg/Burger.svelte'
	import {
		sortState,
		searchString,
		searchKey,
		cookedFilter,
		favouriteFilter
	} from '$lib/stores/recipeFilter'

	let { toggleSidebar, viewOnly, useCats = 'false', username } = $props()

	function updateSort(key) {
		sortState.update((current) => {
			// Toggle direction if the same key is clicked again, otherwise set to 'asc'
			const direction = current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
			return { key, direction }
		})
	}
</script>

{#if viewOnly}
	<div class="mb-4">
		<h3 class="text-2xl font-semibold">{username}'s Cookbook</h3>
	</div>
{/if}
<div class="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between py-4">
	<div class="flex flex-1 items-center gap-2 min-w-0">
		{#if useCats}
			<button
				class="btn btn-square btn-ghost tooltip"
				data-tip="Display Category Filter"
				onclick={toggleSidebar}>
				<Burger width="1.5rem" />
			</button>
		{/if}
		<div class="flex-1">
			<input
				type="text"
				name="search"
				placeholder="Search recipes by..."
				class="input input-bordered w-full"
				bind:value={$searchString} />
		</div>
		<div class="tooltip" data-tip="Choose Search Key">
			<select
				name="selections"
				bind:value={$searchKey}
				id="selections"
				class="select select-bordered min-w-[150px]"
				aria-label="selections">
				<option selected value="name">Name</option>
				<option value="ingredients">Ingredients</option>
				<option value="source">Source</option>
				<option value="notes">Notes</option>
			</select>
		</div>
	</div>
	<div class="flex gap-2 flex-wrap">
		<button
			onclick={() => ($favouriteFilter = !$favouriteFilter)}
			class="btn btn-outline tooltip opacity-60 hover:opacity-100"
			class:opacity-100={$favouriteFilter}
			class:text-error={$favouriteFilter}
			data-tip="Filter by Favourites">
			<Favourite
				favourite={$favouriteFilter}
				width="24px"
				height="24px"
				fill="currentColor" />
		</button>
		<button
			onclick={() => ($cookedFilter = !$cookedFilter)}
			class="btn btn-outline tooltip opacity-60 hover:opacity-100"
			class:opacity-100={$cookedFilter}
			class:text-success={$cookedFilter}
			data-tip="Filter by Cooked">
			<Check
				checked={$cookedFilter}
				width="24px"
				height="24px"
				fill="currentColor" />
		</button>
		<button
			class="btn tooltip"
			class:btn-primary={$sortState.key === 'created'}
			class:btn-outline={$sortState.key !== 'created'}
			data-tip="Sort by Date"
			onclick={() => updateSort('created')}>
			Date <SortAscDesc sort={$sortState.key === 'created' ? $sortState.direction : ''} />
		</button>
		<button
			class="btn tooltip"
			class:btn-primary={$sortState.key === 'name'}
			class:btn-outline={$sortState.key !== 'name'}
			data-tip="Sort by Name"
			onclick={() => updateSort('name')}>
			Title <SortAscDesc sort={$sortState.key === 'name' ? $sortState.direction : ''} />
		</button>
		<button
			class="btn tooltip"
			class:btn-primary={$sortState.key === 'rating'}
			class:btn-outline={$sortState.key !== 'rating'}
			data-tip="Sort by Rating"
			onclick={() => updateSort('rating')}>
			Rating <SortAscDesc sort={$sortState.key === 'rating' ? $sortState.direction : ''} />
		</button>
	</div>
</div>
