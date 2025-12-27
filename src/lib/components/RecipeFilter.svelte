<script>
	import SortAscDesc from '$lib/components/svg/SortAscDesc.svelte' // Adjust the path if needed
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
	import IconButton from '$lib/components/ui/IconButton.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Select from '$lib/components/ui/Form/Select.svelte'

	let { toggleSidebar, viewOnly, useCats = 'false', username } = $props()

	const searchOptions = [
		{ value: 'name', label: 'Name' },
		{ value: 'ingredients', label: 'Ingredients' },
		{ value: 'source', label: 'Source' },
		{ value: 'notes', label: 'Notes' }
	]

	function updateSort(key) {
		sortState.update((current) => {
			// Toggle direction if the same key is clicked again, otherwise set to 'asc'
			const direction = current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
			return { key, direction }
		})
	}
</script>

{#if viewOnly}
	<div class="user-title">
		<h3>{username}'s Cookbook</h3>
	</div>
{/if}
<div class="recipe-filters">
	<div class="search">
		{#if useCats}
			<IconButton data-tooltip="Display Category Filter" onclick={toggleSidebar}>
				<Burger width="1.5rem" />
			</IconButton>
		{/if}
		<div class="search-box">
			<input
				type="text"
				name="search"
				placeholder="Search recipes by..."
				bind:value={$searchString} />
		</div>
		<div data-tooltip="Choose Search Key">
			<Select
				id="selections"
				name="selections"
				bind:value={$searchKey}
				options={searchOptions}
				aria-label="selections" />
		</div>
	</div>
	<div class="sort">
		<IconButton
			onclick={() => ($favouriteFilter = !$favouriteFilter)}
			data-tooltip="Filter by Favourites"
			class="outline secondary">
			<Favourite
				favourite={$favouriteFilter}
				width="30px"
				height="30px"
				fill={$favouriteFilter ? 'var(--pico-del-color)' : 'var(--pico-secondary-focus)'} />
		</IconButton>
		<IconButton
			onclick={() => ($cookedFilter = !$cookedFilter)}
			data-tooltip="Filter by Cooked"
			class="outline secondary">
			<Check
				checked={$cookedFilter}
				width="30px"
				height="30px"
				fill={$cookedFilter ? 'var(--pico-ins-color)' : 'var(--pico-secondary-focus)'} />
		</IconButton>
		<Button
			data-tooltip="Sort by Date"
			class={$sortState.key === 'created' ? 'secondary' : ''}
			onclick={() => updateSort('created')}>
			Date <SortAscDesc sort={$sortState.key === 'created' ? $sortState.direction : ''} />
		</Button>
		<Button
			data-tooltip="Sort by Name"
			class={$sortState.key === 'name' ? 'secondary' : ''}
			onclick={() => updateSort('name')}>
			Title <SortAscDesc sort={$sortState.key === 'name' ? $sortState.direction : ''} />
		</Button>
		<Button
			data-tooltip="Sort by Rating"
			class={$sortState.key === 'rating' ? 'secondary' : ''}
			onclick={() => updateSort('rating')}>
			Rating <SortAscDesc sort={$sortState.key === 'rating' ? $sortState.direction : ''} />
		</Button>
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
