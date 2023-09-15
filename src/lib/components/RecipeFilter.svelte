<script>
	import { createEventDispatcher } from 'svelte'
	import SortAscDesc from '$lib/components/svg/SortAscDesc.svelte' // Adjust the path if needed
	const dispatch = createEventDispatcher()
	export let activeButton // default active button
	export let sortState
	export let searchString // default search value
	export let searchKey
</script>

<div class="grid recipe-filters">
	<div class="search-box">
		<input
			type="text"
			name="search"
			placeholder="Search my recipes by..."
			bind:value={searchString} />
	</div>
	<div data-tooltip="Choose Search Key">
		<select name="selections" bind:value={searchKey} id="selections" aria-label="selections">
			<option selected value="name">Name</option>
			<option value="ingredients">Ingredients</option>
			<option value="source">Source</option>
			<option value="notes">Notes</option>
		</select>
	</div>
	<div class="sort">
		<div>
			<button
				data-tooltip="Sort by Date"
				class={activeButton === 'created' ? 'secondary' : ''}
				on:click={() => {
					activeButton = 'created'
					dispatch('sort', { key: 'created' })
				}}
				>Date <SortAscDesc sort={activeButton === 'created' ? sortState.direction : ''} /></button>
		</div>
		<div>
			<button
				data-tooltip="Sort by Name"
				class={activeButton === 'name' ? 'secondary' : ''}
				on:click={() => {
					activeButton = 'name'
					dispatch('sort', { key: 'name' })
				}}>Title <SortAscDesc sort={activeButton === 'name' ? sortState.direction : ''} /></button>
		</div>
		<div>
			<button
				data-tooltip="Sort by Rating"
				class={activeButton === 'rating' ? 'secondary' : ''}
				on:click={() => {
					activeButton = 'rating'
					dispatch('sort', { key: 'rating' })
				}}
				>Rating <SortAscDesc sort={activeButton === 'rating' ? sortState.direction : ''} /></button>
		</div>
	</div>
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
			margin-bottom: var(--pico-spacing);
			svg {
				display: inline-block; // or just 'inline' depending on your needs
				vertical-align: middle; // to align it with the text
			}
		}
	}

	.sort .secondary {
		border: 1px solid white;
	}

	.search-box,
	select {
		width: 100%;
	}

	.recipe-filters {
		margin-top: 1rem;
		grid-template-columns: 2fr 1fr repeat(3, min-content); // Define the columns
		gap: 1rem; // Space between grid items
		align-items: center; // Vertically center the grid items
		@media (max-width: 1023px) {
			grid-template-columns: 2fr 1fr; // Let the search and select take up the full width
			grid-template-rows: repeat(2, auto); // Two rows: one for search and dropdown, one for buttons
			gap: 0.5rem; // Gap between rows
		}

		@media (max-width: 767px) {
			grid-template-columns: 1fr; // Stack items on top of each other
		}
	}
</style>
