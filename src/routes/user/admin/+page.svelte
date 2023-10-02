<script>
	import Edit from '$lib/components/svg/Edit.svelte'
	import New from '$lib/components/svg/New.svelte'
	import { onMount } from 'svelte'

	export let data
	let users = data.users
	let isDialogOpen = false // dialog is initially closed
	let isEditMode = false

	let editingUser = {
		id: null,
		name: '',
		username: ''
	}

	let dialog

	onMount(() => {
		dialog.addEventListener('close', () => {
			isDialogOpen = false
		})
		document.addEventListener('keydown', handleKeydown)
		return () => {
			// Cleanup when the component is destroyed
			document.removeEventListener('keydown', handleKeydown)
		}
	})

	function handleKeydown(event) {
		if (event.key === 'Escape' && isDialogOpen) {
			isDialogOpen = false
		}
	}

	function openCreateDialog() {
		isEditMode = false
		editingUser = {
			id: null,
			name: '',
			username: ''
		}
		isDialogOpen = true
	}

	async function fetchData() {
		const response = await fetch('/api/user/users') // Adjust this to your actual API endpoint
		if (response.ok) {
			users = await response.json()
		} else {
			console.error('Failed to fetch users')
		}
	}

	function openEditDialog(user) {
		isEditMode = true
		editingUser = { ...user }
		isDialogOpen = true
	}

	async function handleSubmit() {
		const endpoint = isEditMode ? `/api/user/${editingUser.id}` : '/api/user/'
		const method = isEditMode ? 'PUT' : 'POST'

		const response = await fetch(endpoint, {
			method,
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(editingUser)
		})

		// Handle response (e.g., refresh data, close modal)
		if (response.ok) {
			isDialogOpen = false
			await fetchData() // Refresh data after successful update
		} else {
			// Handle error
		}
	}
</script>

<button data-tooltip="New User" on:click={openCreateDialog}
	><New width="30px" height="30px" /></button>

<table>
	<thead>
		<tr>
			<th scope="col">Username</th>
			<th scope="col">Name</th>
			<th scope="col">Email</th>
			<th scope="col">About</th>
			<th scope="col">Admin</th>
			<th scope="col">Edit</th>
		</tr>
	</thead>
	<tbody>
		{#each users as user}
			<tr>
				<th scope="row">{user.username}</th>
				<td>{user.name}</td>
				<td>{user.email}</td>
				<td>{user.about}</td>
				<td>{user.isAdmin}</td>
				<td>
					<button
						on:click={() => openEditDialog(user)}
						data-testid="edit-button"
						class="outline secondary">
						<Edit width="20px" fill="white" />
					</button></td>
			</tr>
		{/each}
	</tbody>
</table>

<dialog bind:this={dialog} open={isDialogOpen}>
	<article>
		<h2>{isEditMode ? 'Edit User' : 'Create User'}</h2>
		<label for="name"> Name </label>
		<input type="text" id="name" name="name" bind:value={editingUser.name} />

		<label for="source"> Username </label>
		<input type="text" id="source" name="source" bind:value={editingUser.username} />
		<label for="source"> Email </label>
		<input type="text" id="source" name="source" bind:value={editingUser.email} />
		<label for="source"> About </label>
		<input type="text" id="source" name="source" bind:value={editingUser.about} />
		<footer>
			<button on:click={() => (isDialogOpen = false)} class="secondary">Cancel</button>
			<button on:click={handleSubmit}>{isEditMode ? 'Update' : 'Create'}</button>
		</footer>
	</article>
</dialog>
