<script>
	import Edit from '$lib/components/svg/Edit.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import New from '$lib/components/svg/New.svelte'
	import { validatePasswords, validateEmail } from '$lib/utils/security.js'
	import { goto } from '$app/navigation'
	import TrueFalse from '$lib/components/TrueFalse.svelte'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import ValidationMessage from '$lib/components/ui/Form/ValidationMessage.svelte'
	import Table from '$lib/components/ui/Table/Table.svelte'
	import TableHead from '$lib/components/ui/Table/TableHead.svelte'
	import TableBody from '$lib/components/ui/Table/TableBody.svelte'
	import TableRow from '$lib/components/ui/Table/TableRow.svelte'
	import TableCell from '$lib/components/ui/Table/TableCell.svelte'
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte'

	/** @type {{data: any}} */
	let { data } = $props()
	let { users, user } = $state(data)
	// If the logged in user is an admin, this will return the id
	// If the page is attempted access by a non-admin, it'll redirect
	let currentAdminUserId = user.adminId
	let isDialogOpen = $state(false) // dialog is initially closed
	let isEditMode = $state(false)
	let password = $state('')
	let passwordConfirm = $state('')
	let userFeedback = $state('')

let editingUser = $state({
	id: null,
	username: '',
	email: '',
	isAdmin: false,
	userSeed: true
})

let emailValidation = $derived(editingUser.email ? validateEmail(editingUser.email) : null)
	let showDeleteConfirm = $state(false)
	let pendingDeleteId = $state(null)

	function openCreateDialog() {
		isEditMode = false
		password = ''
		passwordConfirm = ''
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
		// Require password on create; optional on edit
		if (!isEditMode && !password) {
			userFeedback = 'Password is required.'
			return
		}

		// Validate password if provided
		if (password) {
			if (!passwordValidation?.isValid) {
				userFeedback = passwordValidation?.message ?? 'Invalid password.'
				return
			}
			editingUser = { ...editingUser, password }
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
		pendingDeleteId = id
		showDeleteConfirm = true
	}
	async function confirmDeleteUser() {
		const id = pendingDeleteId
		showDeleteConfirm = false
		if (!id) return
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

	// Password validation (single message)
	let passwordValidation = $derived(
		password || passwordConfirm ? validatePasswords(password, passwordConfirm) : null
	)

	// Disable submit if any validation fails
let isSubmitDisabled = $derived(() => {
	const baseInvalid =
		!editingUser.username ||
		!editingUser.email ||
		(emailValidation && !emailValidation.isValid)
	const hasPasswordInput = password || passwordConfirm
	const passwordInvalid = hasPasswordInput && passwordValidation && !passwordValidation.isValid
		const createMissingPassword = !isEditMode && !hasPasswordInput
		return baseInvalid || passwordInvalid || createMissingPassword
	})
</script>

<button class="btn btn-primary tooltip mb-3" data-tip="New User" onclick={openCreateDialog}>
	<New width="30px" height="30px" fill="currentColor" />
</button>

<Table zebra size="sm" bordered>
	<TableHead>
		<TableRow>
			<TableCell tag="th" scope="col">Username</TableCell>
			<TableCell tag="th" scope="col" class="hidden sm:table-cell">Email</TableCell>
			<TableCell tag="th" scope="col" class="hidden sm:table-cell">Recipes</TableCell>
			<TableCell tag="th" scope="col" class="hidden sm:table-cell">Admin</TableCell>
			<TableCell tag="th" scope="col" class="hidden sm:table-cell">Root</TableCell>
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
				<TableCell class="hidden sm:table-cell">{user.email}</TableCell>
				<TableCell class="hidden sm:table-cell">
					{#if user.recipesCount > 0}
						<a href="/user/{user.id}/recipes">{user.recipesCount}</a>
					{:else}
						0
					{/if}
				</TableCell>
				<TableCell class="hidden sm:table-cell"><TrueFalse isTrue={user.isAdmin} /></TableCell>
				<TableCell class="hidden sm:table-cell"><TrueFalse isTrue={user.isRoot} /></TableCell>
				<TableCell>
					<button
						class="btn btn-outline btn-sm"
						onclick={() => openEditDialog(user)}
						data-testid="edit-button">
						<Edit width="20px" fill="currentColor" />
					</button>
				</TableCell>
				<TableCell>
					{#if user.id !== currentAdminUserId || !user.isRoot}
						<button
							class="btn btn-outline btn-error btn-sm"
							onclick={() => deleteUser(user.id)}
							data-testid="delete-button">
							<Delete width="20px" fill="currentColor" />
						</button>
					{/if}
				</TableCell>
			</TableRow>
		{/each}
	</TableBody>
</Table>

<FeedbackMessage message={userFeedback} type="error" />

<Dialog bind:isOpen={isDialogOpen}>
	<div class="flex flex-col gap-4 w-full">
		<h3 class="font-bold text-lg mb-4">{isEditMode ? 'Edit User' : 'Create User'}</h3>
	<Input
		type="text"
		id="username"
		name="username"
		label="Username"
			class="tooltip"
			data-tip="Username is not editable"
			disabled={isEditMode}
			bind:value={editingUser.username} />
		<Input type="email" id="email" name="email" label="Email" bind:value={editingUser.email} />
		<ValidationMessage
			message={emailValidation?.message}
			isValid={emailValidation?.isValid}
			isError={!emailValidation?.isValid}
			hidden={!emailValidation?.message} />
		<Input type="password" id="password" name="password" label="Password" bind:value={password} />
		<Input
			type="password"
			id="passwordConfirm"
			name="passwordConfirm"
			label="Confirm Password"
			bind:value={passwordConfirm} />
		<ValidationMessage
			message={passwordValidation?.message}
			isValid={passwordValidation?.isValid}
			isError={!passwordValidation?.isValid}
			hidden={!passwordValidation?.message} />
		{#if !isEditMode || !editingUser.isAdmin || adminCount > 1}
			<Checkbox
				name="Admin"
				bind:checked={editingUser.isAdmin}
				legend="Admin"
				size="sm"
				color="primary">
				Give user admin rights
			</Checkbox>
		{/if}
		{#if !isEditMode}
			<Checkbox
				name="Seed Recipes"
				bind:checked={editingUser.userSeed}
				legend="Seed Recipes"
				size="sm"
				color="neutral">Add three sample recipes to account</Checkbox>
		{/if}
		<div class="modal-action">
			<Button onclick={() => (isDialogOpen = false)} style="outline">Cancel</Button>
			<Button onclick={handleSubmit} disabled={isSubmitDisabled}>
				{isEditMode ? 'Update' : 'Create'}
			</Button>
		</div>
	</div>
</Dialog>

<ConfirmationDialog
	bind:isOpen={showDeleteConfirm}
	onClose={() => (showDeleteConfirm = false)}
	onConfirm={confirmDeleteUser}>
	{#snippet content()}
		<h3 class="font-bold text-lg">Delete User</h3>
		<p class="py-4">Are you sure you want to delete this user?</p>
	{/snippet}
</ConfirmationDialog>

<style lang="scss">
	.you-label {
		color: var(--pico-primary); // Use a CSS variable for highlight color or a fixed value.
		margin-left: 0.5em;
	}
</style>
