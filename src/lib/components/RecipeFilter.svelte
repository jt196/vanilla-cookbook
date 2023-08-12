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
	<div>
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
				class={activeButton === 'created' ? 'secondary' : ''}
				on:click={() => {
					activeButton = 'created'
					dispatch('sort', { key: 'created' })
				}}
				>Date <SortAscDesc sort={activeButton === 'created' ? sortState.direction : ''} /></button>
		</div>
		<div>
			<button
				class={activeButton === 'name' ? 'secondary' : ''}
				on:click={() => {
					activeButton = 'name'
					dispatch('sort', { key: 'name' })
				}}>Title <SortAscDesc sort={activeButton === 'name' ? sortState.direction : ''} /></button>
		</div>
		<div>
			<button
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
	}

	.sort .secondary {
		border: 1px solid white;
	}

	.recipe-filters {
		margin-top: 1rem;
	}
</style>
