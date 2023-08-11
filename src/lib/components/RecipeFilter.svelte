<script>
	import SortAscDesc from '$lib/components/svg/SortAscDesc.svelte'

	export let search = ''
	export let dateSort = ''
	export let titleSort = ''
	export let activeButton = ''
	export let sortDate
	export let sortTitle
</script>

<div class="grid recipe-filters">
	<div class="search-box">
		<input type="text" name="search" placeholder="Search my recipes" bind:value={search} />
	</div>
	<div class="sort">
		<div>
			<button class={activeButton === 'date' ? 'secondary' : ''} on:click={sortDate}
				>Date <SortAscDesc sort={dateSort} /></button>
		</div>
		<div>
			<button class={activeButton === 'title' ? 'secondary' : ''} on:click={sortTitle}
				>Title <SortAscDesc sort={titleSort} /></button>
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
