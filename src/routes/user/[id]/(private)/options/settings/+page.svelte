<script>
	import { validatePassword, buildPasswordEnv } from '$lib/utils/security.js'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import ValidationMessage from '$lib/components/ui/Form/ValidationMessage.svelte'
	import ConfirmationDialog from '$lib/components/ui/ConfirmationDialog.svelte'
	import Table from '$lib/components/ui/Table/Table.svelte'
	import TableBody from '$lib/components/ui/Table/TableBody.svelte'
	import TableCell from '$lib/components/ui/Table/TableCell.svelte'
	import TableRow from '$lib/components/ui/Table/TableRow.svelte'

	/** @type {{data: any}} */
	let { data } = $props()
	const {
		user,
		dbRecordCount,
		recipeStats,
		passwordRequirements,
		passwordRequirementsDescription
	} = $state(data)

	// Account settings
	let email = $state(user.email || '')
	let accountFeedback = $state('')

	// Password change
	let oldPass = $state('')
	let newPass = $state('')
	let newPassConfirm = $state('')
	let passwordFeedback = $state('')

	// Privacy settings
	let privacyFeedback = $state('')
	let visibilityFeedback = $state('')
	let setPrivateBusy = $state(false)
	let confirmVisibilityOpen = $state(false)
	let visibilityAction = $state(/** @type {'public' | 'private' | null} */ (null))

	// Password validation
	let passwordsMismatch = $derived(newPass !== newPassConfirm && newPass && newPassConfirm)
	const passwordEnv = $derived(buildPasswordEnv(passwordRequirements))
	let newPasswordValidation = $derived(
		newPass.length > 0 ? validatePassword(newPass, passwordEnv) : null
	)
	let isPasswordSubmitDisabled = $derived(
		!oldPass ||
			!newPass ||
			!newPassConfirm ||
			passwordsMismatch ||
			(newPasswordValidation && !newPasswordValidation.isValid)
	)

	async function updateAccount(event) {
		event.preventDefault()
		const response = await fetch(`/api/user/${user.userId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...user, email })
		})
		if (response.ok) {
			accountFeedback = 'Account updated successfully!'
		} else {
			accountFeedback = 'There was a problem updating your account!'
		}
	}

	async function updatePassword(event) {
		event.preventDefault()
		passwordFeedback = ''

		if (passwordsMismatch) {
			passwordFeedback = "Passwords don't match!"
			return
		}

		if (newPasswordValidation && !newPasswordValidation.isValid) {
			passwordFeedback = newPasswordValidation.message
			return
		}

		const response = await fetch(`/api/user/${user.userId}/password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ oldPass, newPass, newPassConfirm })
		})

		if (response.ok) {
			passwordFeedback = 'Password updated successfully!'
			oldPass = ''
			newPass = ''
			newPassConfirm = ''
		} else {
			try {
				const responseData = await response.json()
				if (response.status === 401) {
					passwordFeedback = responseData.error || 'Old password is incorrect!'
				} else {
					passwordFeedback = 'There was a problem updating your password!'
				}
			} catch (e) {
				passwordFeedback = 'There was a problem updating your password!'
			}
		}
	}

	async function updatePrivacy(event) {
		event.preventDefault()
		const response = await fetch(`/api/user/${user.userId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(user)
		})
		if (response.ok) {
			privacyFeedback = 'Privacy settings updated successfully!'
		} else {
			privacyFeedback = 'There was a problem updating your privacy settings!'
		}
	}

	async function makeAllRecipesPrivate() {
		setPrivateBusy = true
		visibilityFeedback = ''
		try {
			const response = await fetch(`/api/user/${user.userId}/recipes/privacy`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isPublic: false })
			})
			const payload = await response.json().catch(() => null)
			if (response.ok) {
				visibilityFeedback = payload?.message || 'All recipes were set to private.'
			} else {
				visibilityFeedback = payload?.error || 'There was a problem updating recipe visibility.'
			}
		} finally {
			setPrivateBusy = false
		}
	}

	async function makeAllRecipesPublic() {
		setPrivateBusy = true
		visibilityFeedback = ''
		try {
			const response = await fetch(`/api/user/${user.userId}/recipes/privacy`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isPublic: true })
			})
			const payload = await response.json().catch(() => null)
			if (response.ok) {
				visibilityFeedback = payload?.message || 'All recipes were set to public.'
			} else {
				visibilityFeedback = payload?.error || 'There was a problem updating recipe visibility.'
			}
		} finally {
			setPrivateBusy = false
		}
	}

	function openVisibilityConfirm(action) {
		visibilityAction = action
		confirmVisibilityOpen = true
	}

	function closeVisibilityConfirm() {
		confirmVisibilityOpen = false
		visibilityAction = null
	}

	async function confirmVisibilityAction() {
		if (visibilityAction === 'private') {
			await makeAllRecipesPrivate()
		} else if (visibilityAction === 'public') {
			await makeAllRecipesPublic()
		}
		closeVisibilityConfirm()
	}
</script>

<div class="flex flex-col gap-6 w-full md:w-2/3 lg:w-1/2">
	<!-- Logout -->
	<form method="POST">
		<Button id="logout" formaction="/logout" type="submit" class="w-auto">Logout</Button>
	</form>

	<!-- Account Info -->
	<div class="prose max-w-none">
		<p class="mb-1">Recipe Stats</p>
		<Table size="sm" bordered={true} containerClass="max-w-sm">
			<TableBody>
				<TableRow>
					<TableCell tag="th" scope="row">Total</TableCell>
					<TableCell>{recipeStats?.total ?? dbRecordCount}</TableCell>
				</TableRow>
				<TableRow>
					<TableCell tag="th" scope="row">Public</TableCell>
					<TableCell>{recipeStats?.public ?? 0}</TableCell>
				</TableRow>
				<TableRow>
					<TableCell tag="th" scope="row">Private</TableCell>
					<TableCell>{recipeStats?.private ?? 0}</TableCell>
				</TableRow>
				<TableRow>
					<TableCell tag="th" scope="row">Cooked</TableCell>
					<TableCell>{recipeStats?.cooked ?? 0}</TableCell>
				</TableRow>
				<TableRow>
					<TableCell tag="th" scope="row">Favourites</TableCell>
					<TableCell>{recipeStats?.favourites ?? 0}</TableCell>
				</TableRow>
			</TableBody>
		</Table>
		<p class="mt-2">
			Version: <i>{data.version}</i>
		</p>
	</div>

	<!-- Account Details -->
	<form onsubmit={updateAccount} class="flex flex-col gap-4">
		<h2 class="prose max-w-none mb-2">Account</h2>
		<Input type="text" id="username" label="Username" value={user.username} disabled />
		<Input type="email" id="email" label="Email" placeholder="Email address" bind:value={email} />
		<footer>
			<Button type="submit">Update Account</Button>
			<FeedbackMessage message={accountFeedback} />
		</footer>
	</form>

	<!-- Password Change -->
	<form onsubmit={updatePassword} class="flex flex-col gap-4">
		<h2 class="prose max-w-none mb-2">Change Password</h2>
		{#if passwordRequirementsDescription}
			<p class="text-sm text-base-content/70">{passwordRequirementsDescription}</p>
		{/if}
		<Input
			type="password"
			id="old"
			label="Current Password"
			placeholder="Current Password"
			bind:value={oldPass} />
		<Input
			type="password"
			id="new"
			label="New Password"
			placeholder="New Password"
			bind:value={newPass} />
		<Input
			type="password"
			id="confirm"
			label="Confirm New Password"
			placeholder="Confirm New Password"
			bind:value={newPassConfirm} />
		<ValidationMessage
			message={newPasswordValidation?.message}
			isValid={newPasswordValidation?.isValid} />
		<ValidationMessage
			message={passwordsMismatch ? "Passwords don't match!" : null}
			isError={true} />
		<footer>
			<Button type="submit" disabled={isPasswordSubmitDisabled}>Update Password</Button>
			<FeedbackMessage message={passwordFeedback} />
		</footer>
	</form>

	<!-- Privacy -->
	<h2 class="prose max-w-none mb-2">Privacy</h2>
	<form onsubmit={updatePrivacy} class="flex flex-col gap-4">
		<div class="flex flex-col gap-2">
			<Checkbox
				name="Profile Privacy"
				legend="Profile Privacy"
				bind:checked={user.publicProfile}
				size="sm"
				color="primary">
				{user.publicProfile
					? 'Your profile is visible to other users.'
					: 'Your profile is hidden from other users.'}
			</Checkbox>
			<Checkbox
				name="Recipe Privacy"
				bind:checked={user.publicRecipes}
				legend="Recipe Privacy"
				size="sm"
				color="primary">
				{user.publicRecipes
					? 'New recipes are public by default.'
					: 'New recipes are private by default.'}
			</Checkbox>
		</div>
		<footer>
			<Button type="submit">Update Privacy</Button>
			<FeedbackMessage message={privacyFeedback} />
		</footer>
	</form>

	<!-- Recipe Visibility Actions -->
	<div class="flex flex-col gap-2">
		<p class="text-sm text-base-content/70">
			Use this action to make existing recipes private. This does not change your default for new
			recipes.
		</p>
		<div>
			<Button
				type="button"
				color="error"
				style="outline"
				loading={setPrivateBusy}
				onclick={() => openVisibilityConfirm('private')}>Make All Recipes Private</Button>
			<Button
				type="button"
				color="success"
				style="outline"
				loading={setPrivateBusy}
				class="ml-2"
				onclick={() => openVisibilityConfirm('public')}>Make All Recipes Public</Button>
		</div>
		<FeedbackMessage message={visibilityFeedback} />
	</div>
</div>

<ConfirmationDialog
	bind:isOpen={confirmVisibilityOpen}
	onClose={closeVisibilityConfirm}
	onConfirm={confirmVisibilityAction}>
	{#snippet content()}
		<h3 class="font-bold text-lg">Confirm Visibility Change</h3>
		{#if visibilityAction === 'public'}
			<p class="py-4">
				This will make <strong>all</strong> of your recipes public. Are you sure?
			</p>
		{:else if visibilityAction === 'private'}
			<p class="py-4">
				This will make <strong>all</strong> of your recipes private. Are you sure?
			</p>
		{/if}
	{/snippet}
</ConfirmationDialog>
