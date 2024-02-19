<script>
	import SortAscDesc from '$lib/components/svg/SortAscDesc.svelte' // Adjust the path if needed
	import { sortState, searchString, searchKey, favouriteFilter, cookedFilter } from '$lib/stores'

	function updateSort(key) {
		sortState.update((current) => {
			// Toggle direction if the same key is clicked again, otherwise set to 'asc'
			const direction = current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
			return { key, direction }
		})
	}
</script>

<div class="grid recipe-filters">
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
	<div class="sort">
		<button
			data-tooltip="Sort by Date"
			class:secondary={$sortState.key === 'created'}
			on:click={() => updateSort('created')}>
			Date <SortAscDesc sort={$sortState.key === 'created' ? $sortState.direction : ''} />
		</button>
		<button
			data-tooltip="Sort by Name"
			class:secondary={$sortState.key === 'name'}
			on:click={() => updateSort('name')}>
			Title <SortAscDesc sort={$sortState.key === 'name' ? $sortState.direction : ''} />
		</button>
		<button
			data-tooltip="Sort by Rating"
			class:secondary={$sortState.key === 'rating'}
			on:click={() => updateSort('rating')}>
			Rating <SortAscDesc sort={$sortState.key === 'rating' ? $sortState.direction : ''} />
		</button>
	</div>
</div>
<div class="switches">
	<fieldset>
		<label>
			<input name="terms" type="checkbox" role="switch" bind:checked={$cookedFilter} />
			Cooked
		</label>
		<label>
			<input name="opt-in" type="checkbox" role="switch" bind:checked={$favouriteFilter} />
			Favourites
		</label>
	</fieldset>
</div>

<style lang="scss">
	.sort {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		@media (max-width: 1023px) {
			grid-column: 1 / 3; // Span the buttons across both columns
			grid-row: 2; // Place the buttons in the second row
			justify-content: center; // Center the buttons horizontally
			flex-wrap: wrap; // Allow the buttons to wrap to the next line
			gap: 0.5rem; // Add some gap between wrapped buttons for spacing
		}
		@media (max-width: 767px) {
			grid-column: 1; // Ensure buttons take up the full width
			grid-row: 3; // Place the buttons in the third row
		}

		button {
			white-space: nowrap;
			margin-bottom: 0.5rem;
			svg {
				display: inline-block; // or just 'inline' depending on your needs
				vertical-align: middle; // to align it with the text
			}
		}
	}

	.sort .secondary {
		border: 1px solid white;
	}

	.switches {
		fieldset {
			display: flex;
			gap: 1rem;
		}
	}

	.recipe-filters {
		margin: 0.5rem 0 0 0;
		input {
			margin-bottom: 0.5rem;
		}
		grid-template-columns: 1fr auto 1fr;
		gap: 1rem; // Space between grid items
		align-items: center; // Vertically center the grid items
		@media (max-width: 1023px) {
			grid-template-columns: 2fr 1fr; // Let the search and select take up the full width
			grid-template-rows: repeat(2, auto); // Two rows: one for search and dropdown, one for buttons
			gap: 0.5rem; // Gap between rows
			input {
				height: 2.5rem;
				margin-bottom: 0;
			}
			#selections {
				line-height: 1rem;
				margin-bottom: 0;
			}
		}

		@media (max-width: 767px) {
			grid-template-columns: 1fr; // Stack items on top of each other
		}
	}

	#selections {
		margin-bottom: 0.5rem;
	}
</style>
