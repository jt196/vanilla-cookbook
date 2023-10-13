<script>
	import Edit from '$lib/components/svg/Edit.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import New from '$lib/components/svg/New.svelte'
	import { validatePassword } from '$lib/utils/security.js'
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import TrueFalse from '$lib/components/TrueFalse.svelte'

	export let data
	let users = data.users
	// If the logged in user is an admin, this will return the id
	// If the page is attempted access by a non-admin, it'll redirect
	let currentAdminUserId = data.adminId
	let isDialogOpen = false // dialog is initially closed
	let isEditMode = false
	let password = ''

	$: adminCount = users.filter((user) => user.isAdmin).length
	$: {
		// Find the index of the user being edited in the users array
		const index = users.findIndex((user) => user.id === editingUser.id)

		// If the user is found, update its data
		if (index !== -1) {
			users[index] = { ...editingUser }
		}
	}
	$: passwordFeedback = password.length > 0 ? validatePassword(password) : null

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
		const response = await fetch('/api/user/admin/users') // Adjust this to your actual API endpoint
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
		if (passwordFeedback) {
			if (!passwordFeedback.isValid) {
				return // exit if password is not valid
			}
			editingUser = { password, ...editingUser }
		}

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
			if (currentAdminUserId === editingUser.id && editingUser.isAdmin === false) {
				await fetch('/logout', { method: 'POST' })
				setTimeout(() => {
					goto('/login')
				}, 2000)
			} else {
				await fetchData() // Refresh data after successful update
			}
		} else {
			// Handle error
		}
	}
	async function deleteUser(id) {
		if (!confirm('Are you sure you want to delete this user?')) {
			return
		}
		try {
			const response = await fetch(`/api/user/${id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Error deleting user')
			}
			await fetchData()
		} catch (error) {
			console.error('Error deleting user:', error.message)
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
			<th scope="col">Root</th>
			<th scope="col">Edit</th>
			<th scope="col">Del</th>
		</tr>
	</thead>
	<tbody>
		{#each users as user}
			<tr>
				<th scope="row"
					>{user.username}
					{#if user.id === currentAdminUserId}
						<span class="you-label">(You)</span>
					{/if}</th>
				<td>{user.name}</td>
				<td>{user.email}</td>
				<td>{user.about}</td>
				<td><TrueFalse isTrue={user.isAdmin} /></td>
				<td><TrueFalse isTrue={user.isRoot} /></td>
				<td>
					<button
						on:click={() => openEditDialog(user)}
						data-testid="edit-button"
						class="outline secondary">
						<Edit width="20px" fill="var(--pico-ins-color)" />
					</button></td>
				<td>
					{#if user.id !== currentAdminUserId || !user.isRoot}
						<button
							on:click={() => deleteUser(user.id)}
							data-testid="delete-button"
							class="outline secondary">
							<Delete width="20px" fill="var(--pico-del-color)" />
						</button>
					{/if}
				</td>
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
		<label for="source"> Password </label>
		<input type="text" id="source" name="source" bind:value={password} />
		{#if !editingUser.isAdmin || (editingUser.isAdmin && adminCount > 1)}
			<label>
				<input type="checkbox" name="Admin" bind:checked={editingUser.isAdmin} />
				Admin
			</label>
		{/if}
		<footer>
			{#if passwordFeedback && passwordFeedback.message}
				<p class="feedback">{passwordFeedback.message}</p>
			{/if}
			<button on:click={() => (isDialogOpen = false)} class="secondary">Cancel</button>
			<button on:click={handleSubmit}>{isEditMode ? 'Update' : 'Create'}</button>
		</footer>
	</article>
</dialog>

<style lang="scss">
	.you-label {
		font-size: 0.9em;
		color: var(
			--highlight-color,
			#007bff
		); // Use a CSS variable for highlight color or a fixed value.
		margin-left: 0.5em;
	}
</style>
