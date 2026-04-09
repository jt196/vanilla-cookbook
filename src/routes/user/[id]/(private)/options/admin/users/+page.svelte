<script>
	import Edit from '$lib/components/svg/Edit.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import New from '$lib/components/svg/New.svelte'
	import { validatePasswords, validateEmail, buildPasswordEnv } from '$lib/utils/security.js'
	import { goto } from '$app/navigation'
	import TrueFalse from '$lib/components/ui/TrueFalse.svelte'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
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
	import ConfirmationDialog from '$lib/components/ui/ConfirmationDialog.svelte'
	import { t } from '$lib/stores/locale.js'

	/** @type {{data: any}} */
	let { data } = $props()
	let { users, user, passwordRequirements, passwordRequirementsDescription } = $state(data)
	// If the logged in user is an admin, this will return the id
	// If the page is attempted access by a non-admin, it'll redirect
	let currentAdminUserId = user.adminId
	let isDialogOpen = $state(false) // dialog is initially closed
	let isEditMode = $state(false)
	let password = $state('')
	let passwordConfirm = $state('')
	let userFeedback = $state('')
	let userFeedbackCode = $state(null)
	let userFeedbackType = $state('error')

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

	const passwordEnv = $derived(buildPasswordEnv(passwordRequirements))

	function openCreateDialog() {
		isEditMode = false
		password = ''
		passwordConfirm = ''
		userFeedback = ''
		userFeedbackCode = null
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
		userFeedback = ''
		userFeedbackCode = null
		// Use a deep clone to avoid unintentional two-way binding
		editingUser = JSON.parse(JSON.stringify(user))
		isDialogOpen = true
	}

	async function handleSubmit() {
		const endpoint = isEditMode ? `/api/user/${editingUser.id}/admin` : '/api/user/'
		const method = isEditMode ? 'PUT' : 'POST'
		// Require password on create; optional on edit
		if (!isEditMode && !password) {
			userFeedback = ''
			userFeedbackCode = 'admin.users.msg.passwordRequired'
			userFeedbackType = 'error'
			return
		}

		// Validate password if provided
		if (password) {
			if (!passwordValidation?.isValid) {
				userFeedback = passwordValidation?.message ?? ''
				userFeedbackCode = passwordValidation?.messageCode ?? 'admin.users.msg.passwordInvalid'
				userFeedbackType = 'error'
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
			userFeedback = ''
			userFeedbackCode =
				data.code || (isEditMode ? 'admin.users.msg.updated' : 'admin.users.msg.created')
			userFeedbackType = 'success'
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
			userFeedback = data.error || ''
			userFeedbackCode =
				data.code || (isEditMode ? 'admin.users.msg.updateFail' : 'admin.users.msg.createFail')
			userFeedbackType = 'error'
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
				throw Object.assign(
					new Error(errorData.error || errorData.message || 'Error deleting user'),
					{
						code: errorData.code || null
					}
				)
			}
			userFeedback = ''
			userFeedbackCode = 'admin.users.msg.deleted'
			userFeedbackType = 'success'
			await fetchData()
		} catch (error) {
			console.error('Error deleting user:', error.message)
			userFeedback = error.message
			userFeedbackCode = error.code || 'admin.users.msg.deleteFail'
			userFeedbackType = 'error'
		}
	}
	let adminCount = $derived(users.filter((user) => user.isAdmin).length)

	// Password validation (single message)
	let passwordValidation = $derived(
		password || passwordConfirm ? validatePasswords(password, passwordConfirm, passwordEnv) : null
	)

	// Disable submit if any validation fails
	const usernameOk = $derived(!!editingUser.username)
	const emailOk = $derived(!!emailValidation?.isValid)
	const passwordOk = $derived(
		isEditMode
			? (!password && !passwordConfirm) || !!passwordValidation?.isValid
			: !!passwordValidation?.isValid
	)
	let isSubmitDisabled = $derived(!(usernameOk && emailOk && passwordOk))
</script>

<Button class="tooltip mb-3" data-tip={$t('admin.users.newUser')} onclick={openCreateDialog}>
	<New width="30px" height="30px" fill="currentColor" />
</Button>

<Table zebra size="sm" bordered>
	<TableHead>
		<TableRow>
			<TableCell tag="th" scope="col">{$t('admin.users.username')}</TableCell>
			<TableCell tag="th" scope="col" class="hidden sm:table-cell"
				>{$t('admin.users.email')}</TableCell
			>
			<TableCell tag="th" scope="col" class="hidden sm:table-cell"
				>{$t('admin.users.recipes')}</TableCell
			>
			<TableCell tag="th" scope="col" class="hidden sm:table-cell"
				>{$t('admin.users.adminCol')}</TableCell
			>
			<TableCell tag="th" scope="col" class="hidden sm:table-cell"
				>{$t('admin.users.rootCol')}</TableCell
			>
			<TableCell tag="th" scope="col">{$t('admin.users.editCol')}</TableCell>
			<TableCell tag="th" scope="col">{$t('admin.users.deleteCol')}</TableCell>
		</TableRow>
	</TableHead>
	<TableBody>
		{#each users as user}
			<TableRow>
				<TableCell tag="th" scope="row"
					>{user.username}
					{#if user.id === currentAdminUserId}
						<span class="you-label">{$t('admin.users.youLabel')}</span>
					{/if}</TableCell
				>
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
					<Button
						style="outline"
						size="sm"
						onclick={() => openEditDialog(user)}
						data-testid="edit-button"
					>
						<Edit width="20px" fill="currentColor" />
					</Button>
				</TableCell>
				<TableCell>
					{#if user.id !== currentAdminUserId || !user.isRoot}
						<Button
							style="outline"
							color="error"
							size="sm"
							onclick={() => deleteUser(user.id)}
							data-testid="delete-button"
						>
							<Delete width="20px" fill="currentColor" />
						</Button>
					{/if}
				</TableCell>
			</TableRow>
		{/each}
	</TableBody>
</Table>

<FeedbackMessage message={userFeedback} messageCode={userFeedbackCode} type={userFeedbackType} />

<Dialog bind:isOpen={isDialogOpen}>
	<div class="flex flex-col gap-4 w-full">
		<h3 class="font-bold text-lg mb-4">
			{isEditMode ? $t('admin.users.editTitle') : $t('admin.users.createTitle')}
		</h3>
		<Input
			type="text"
			id="username"
			name="username"
			label={$t('admin.users.username')}
			class="tooltip"
			data-tip={$t('admin.users.usernameNotEditable')}
			disabled={isEditMode}
			bind:value={editingUser.username}
		/>
		<Input
			type="email"
			id="email"
			name="email"
			label={$t('admin.users.email')}
			bind:value={editingUser.email}
		/>
		<ValidationMessage
			message={emailValidation?.message}
			messageCode={emailValidation?.messageCode}
			isValid={emailValidation?.isValid}
			isError={!emailValidation?.isValid}
			hidden={!emailValidation?.message}
		/>
		<Input
			type="password"
			id="password"
			name="password"
			label={$t('auth.password')}
			bind:value={password}
		/>
		{#if passwordRequirementsDescription}
			<p class="text-sm text-base-content/70">{passwordRequirementsDescription}</p>
		{/if}
		<Input
			type="password"
			id="passwordConfirm"
			name="passwordConfirm"
			label={$t('auth.confirmPassword')}
			bind:value={passwordConfirm}
		/>
		<ValidationMessage
			message={passwordValidation?.message}
			messageCode={passwordValidation?.messageCode}
			messageVars={passwordValidation?.messageVars}
			isValid={passwordValidation?.isValid}
			isError={!passwordValidation?.isValid}
			hidden={!passwordValidation?.message}
		/>
		{#if !isEditMode || !editingUser.isAdmin || adminCount > 1}
			<Checkbox
				name="Admin"
				bind:checked={editingUser.isAdmin}
				legend={$t('admin.users.adminCol')}
				size="sm"
				color="primary"
			>
				{editingUser.isAdmin ? $t('admin.users.adminRights') : $t('admin.users.standardRights')}
			</Checkbox>
		{/if}
		{#if !isEditMode}
			<Checkbox
				name="Seed Recipes"
				bind:checked={editingUser.userSeed}
				legend={$t('admin.users.seedRecipes')}
				size="sm"
				color="neutral"
			>
				{editingUser.userSeed ? $t('admin.users.seedYes') : $t('admin.users.seedNo')}
			</Checkbox>
		{/if}
		<div class="modal-action">
			<Button onclick={() => (isDialogOpen = false)} style="outline">{$t('common.cancel')}</Button>
			<Button onclick={handleSubmit} disabled={isSubmitDisabled}>
				{isEditMode ? $t('common.update') : $t('common.create')}
			</Button>
		</div>
	</div>
</Dialog>

<ConfirmationDialog
	bind:isOpen={showDeleteConfirm}
	onClose={() => (showDeleteConfirm = false)}
	onConfirm={confirmDeleteUser}
>
	{#snippet content()}
		<h3 class="font-bold text-lg">{$t('admin.users.deleteTitle')}</h3>
		<p class="py-4">{$t('admin.users.confirmDelete')}</p>
	{/snippet}
</ConfirmationDialog>

<style lang="scss">
	.you-label {
		color: var(--pico-primary); // Use a CSS variable for highlight color or a fixed value.
		margin-left: 0.5em;
	}
</style>
