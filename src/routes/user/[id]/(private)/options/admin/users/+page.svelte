<script>
	import Edit from '$lib/components/svg/Edit.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import New from '$lib/components/svg/New.svelte'
	import { validatePassword } from '$lib/utils/security.js'
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import TrueFalse from '$lib/components/TrueFalse.svelte'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Table from '$lib/components/ui/Table/Table.svelte'
	import TableHead from '$lib/components/ui/Table/TableHead.svelte'
	import TableBody from '$lib/components/ui/Table/TableBody.svelte'
	import TableRow from '$lib/components/ui/Table/TableRow.svelte'
	import TableCell from '$lib/components/ui/Table/TableCell.svelte'

	/** @type {{data: any}} */
	let { data } = $props()
	let { users, user } = $state(data)
	// If the logged in user is an admin, this will return the id
	// If the page is attempted access by a non-admin, it'll redirect
	let currentAdminUserId = user.adminId
	let isDialogOpen = $state(false) // dialog is initially closed
	let isEditMode = $state(false)
	let password = $state('')
	let userFeedback = $state('')

	let editingUser = $state({
		id: null,
		username: '',
		email: '',
		isAdmin: false,
		userSeed: true
	})

	let dialog = $state()

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
		password = ''
		editingUser = {
			id: null,
			username: '',
			email: '',
			isAdmin: false,
			userSeed: true
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
		// Use a deep clone to avoid unintentional two-way binding
		editingUser = JSON.parse(JSON.stringify(user))
		isDialogOpen = true
	}

	async function handleSubmit() {
		const endpoint = isEditMode ? `/api/user/${editingUser.id}/admin` : '/api/user/'
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

		const data = await response.json()

		// Handle response (e.g., refresh data, close modal)
		if (response.ok) {
			// Update the local users array with the new editingUser data
			const updatedUsers = users.map((u) => (u.id === editingUser.id ? editingUser : u))
			users = updatedUsers
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
			console.error('Error updating user:', data.error)
			// Optionally, tailor error messages based on content
			if (data.error && data.error.toLowerCase().includes('username already taken')) {
				userFeedback = 'Username already taken!'
			} else if (data.error && data.error.toLowerCase().includes('email already taken')) {
				userFeedback = 'Email already taken!'
			} else {
				console.log('An unknown error occurred:', data.error)
				userFeedback = 'There was an error updating the user!'
			}
		}
	}
	async function deleteUser(id) {
		if (!confirm('Are you sure you want to delete this user?')) {
			return
		}
		try {
			console.log('Deleting User!')
			const response = await fetch(`/api/user/${id}/admin`, {
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
	let adminCount = $derived(users.filter((user) => user.isAdmin).length)

	let passwordFeedback = $derived(password.length > 0 ? validatePassword(password) : null)
</script>

<Button data-tooltip="New User" onclick={openCreateDialog}
	><New width="30px" height="30px" /></Button>

<Table>
	<TableHead>
		<TableRow>
			<TableCell tag="th" scope="col">Username</TableCell>
			<TableCell tag="th" scope="col">Email</TableCell>
			<TableCell tag="th" scope="col">Recipes</TableCell>
			<TableCell tag="th" scope="col">Admin</TableCell>
			<TableCell tag="th" scope="col">Root</TableCell>
			<TableCell tag="th" scope="col">Edit</TableCell>
			<TableCell tag="th" scope="col">Del</TableCell>
		</TableRow>
	</TableHead>
	<TableBody>
		{#each users as user}
			<TableRow>
				<TableCell tag="th" scope="row"
					>{user.username}
					{#if user.id === currentAdminUserId}
						<span class="you-label">(You)</span>
					{/if}</TableCell>
				<TableCell>{user.email}</TableCell>
				<TableCell>
					{#if user.recipesCount > 0}
						<a href="/user/{user.id}/recipes">{user.recipesCount}</a>
					{:else}
						0
					{/if}
				</TableCell>
				<TableCell><TrueFalse isTrue={user.isAdmin} /></TableCell>
				<TableCell><TrueFalse isTrue={user.isRoot} /></TableCell>
				<TableCell>
					<Button
						onclick={() => openEditDialog(user)}
						data-testid="edit-button"
						class="outline secondary">
						<Edit width="20px" fill="var(--pico-ins-color)" />
					</Button></TableCell>
				<TableCell>
					{#if user.id !== currentAdminUserId || !user.isRoot}
						<Button
							onclick={() => deleteUser(user.id)}
							data-testid="delete-button"
							class="outline secondary">
							<Delete width="20px" fill="var(--pico-del-color)" />
						</Button>
					{/if}
				</TableCell>
			</TableRow>
		{/each}
	</TableBody>
</Table>

<FeedbackMessage message={userFeedback} type="error" />

<dialog bind:this={dialog} open={isDialogOpen}>
	<article>
		<h2>{isEditMode ? 'Edit User' : 'Create User'}</h2>
		<Input
			type="text"
			id="username"
			name="username"
			label="Username"
			data-tooltip="Username is not editable"
			disabled={isEditMode}
			bind:value={editingUser.username} />
		<Input type="email" id="email" name="email" label="Email" bind:value={editingUser.email} />
		<Input type="password" id="password" name="password" label="Password" bind:value={password} />
		{#if !isEditMode || !editingUser.isAdmin || adminCount > 1}
			<Checkbox name="Admin" bind:checked={editingUser.isAdmin} label="Admin" />
		{/if}
		{#if !isEditMode}
			<Checkbox name="Seed Recipes" bind:checked={editingUser.userSeed} label="Seed Recipes" />
		{/if}
		<footer>
			{#if passwordFeedback && passwordFeedback.message}
				<p class="feedback">{passwordFeedback.message}</p>
			{/if}
			<Button onclick={() => (isDialogOpen = false)} class="secondary">Cancel</Button>
			<Button onclick={handleSubmit}>{isEditMode ? 'Update' : 'Create'}</Button>
		</footer>
	</article>
</dialog>

<style lang="scss">
	.you-label {
		color: var(--pico-primary); // Use a CSS variable for highlight color or a fixed value.
		margin-left: 0.5em;
	}
</style>
