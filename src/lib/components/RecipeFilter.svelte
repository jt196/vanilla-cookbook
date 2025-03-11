<script>
	import SortAscDesc from '$lib/components/svg/SortAscDesc.svelte' // Adjust the path if needed
	import Favourite from '$lib/components/svg/Favourite.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import Burger from '$lib/components/svg/Burger.svelte'
	import { goto } from '$app/navigation'
	import House from '$lib/components/svg/House.svelte'
	import {
		sortState,
		searchString,
		searchKey,
		cookedFilter,
		favouriteFilter
	} from '$lib/stores/recipeFilter'

	let { toggleSidebar, viewOnly } = $props()

	function updateSort(key) {
		sortState.update((current) => {
			// Toggle direction if the same key is clicked again, otherwise set to 'asc'
			const direction = current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
			return { key, direction }
		})
	}
</script>

<div class="recipe-filters">
	<div class="search">
		<div>
			{#if !viewOnly}
				<button data-tooltip="Display Category Filter" onclick={toggleSidebar}>
					<Burger width="1.5rem" />
				</button>
			{:else}
				<button
					data-tooltip="Go to my recipes"
					onclick={() => goto(`/user/${viewingUserId}/recipes`)}>
					<House width="1.5rem" />
				</button>
				<h3>{publicProfile.name} Recipes</h3>
			{/if}
		</div>
		<div class="search-box">
			<input
				type="text"
				name="search"
				placeholder="Search my recipes by..."
				bind:value={$searchString} />
		</div>
		<div data-tooltip="Choose Search Key">
			<select name="selections" bind:value={$searchKey} id="selections" aria-label="selections">
				<option selected value="name">Name</option>
				<option value="ingredients">Ingredients</option>
				<option value="source">Source</option>
				<option value="notes">Notes</option>
			</select>
		</div>
	</div>
	<div class="sort">
		<button
			onclick={() => ($favouriteFilter = !$favouriteFilter)}
			data-tooltip="Filter by Favourites"
			class="outline secondary">
			<Favourite
				favourite={$favouriteFilter}
				width="30px"
				height="30px"
				fill="var(--pico-del-color)" />
		</button>
		<button
			onclick={() => ($cookedFilter = !$cookedFilter)}
			data-tooltip="Filter by Cooked"
			class="outline secondary">
			<Check
				checked={$cookedFilter}
				width="30px"
				height="30px"
				fill={$cookedFilter ? 'var(--pico-ins-color)' : 'var(--pico-del-color)'} />
		</button>
		<button
			data-tooltip="Sort by Date"
			class:secondary={$sortState.key === 'created'}
			onclick={() => updateSort('created')}>
			Date <SortAscDesc sort={$sortState.key === 'created' ? $sortState.direction : ''} />
		</button>
		<button
			data-tooltip="Sort by Name"
			class:secondary={$sortState.key === 'name'}
			onclick={() => updateSort('name')}>
			Title <SortAscDesc sort={$sortState.key === 'name' ? $sortState.direction : ''} />
		</button>
		<button
			data-tooltip="Sort by Rating"
			class:secondary={$sortState.key === 'rating'}
			onclick={() => updateSort('rating')}>
			Rating <SortAscDesc sort={$sortState.key === 'rating' ? $sortState.direction : ''} />
		</button>
	</div>
</div>

<style lang="scss">
	.recipe-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 0 1rem 0;
		border-bottom: 1px solid #ccc;
	}

	.search {
		display: flex;
		flex-grow: 1;
		align-items: center;
		gap: 0.5rem;
		min-width: 0; // Ensures it can shrink properly
	}

	.search input,
	.search select,
	.search button {
		height: 45px; /* Ensures all inputs, selects, and buttons are uniform */
		margin-bottom: 0;
	}

	.search-box {
		flex-grow: 1;
	}

	.search-box input {
		width: 100%;
		min-width: 150px;
		padding: 0.5rem;
	}

	#selections {
		flex-shrink: 0;
		min-width: 150px;
		padding: 0.5rem;
	}

	.sort {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.sort button {
		padding: 0.5rem;
		white-space: nowrap;
	}

	/* Mobile - Stack search and sort */
	@media (max-width: 1024px) {
		.recipe-filters {
			flex-direction: column;
			align-items: stretch;
		}

		.search {
			width: 100%;
		}

		.search-box input {
			flex-grow: 1;
		}

		.sort {
			width: 100%;
			display: flex;
			flex-wrap: wrap;
		}

		.sort button {
			flex: 1;
			text-align: center;
		}
	}
</style>
