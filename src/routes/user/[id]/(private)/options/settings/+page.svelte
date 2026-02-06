<script>
	import { validatePassword, buildPasswordEnv } from '$lib/utils/security.js'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import ValidationMessage from '$lib/components/ui/Form/ValidationMessage.svelte'

	/** @type {{data: any}} */
	let { data } = $props()
	const { user, dbRecordCount, passwordRequirements, passwordRequirementsDescription } =
		$state(data)

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
</script>

<div class="flex flex-col gap-6 w-full md:w-2/3 lg:w-1/2">
	<!-- Logout -->
	<form method="POST">
		<Button id="logout" formaction="/logout" type="submit" class="w-auto">Logout</Button>
	</form>

	<!-- Account Info -->
	<div class="prose max-w-none">
		You have {dbRecordCount} recipes in your account.
		<br />
		Version: <i>{data.version}</i>
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
			bind:value={oldPass}
		/>
		<Input
			type="password"
			id="new"
			label="New Password"
			placeholder="New Password"
			bind:value={newPass}
		/>
		<Input
			type="password"
			id="confirm"
			label="Confirm New Password"
			placeholder="Confirm New Password"
			bind:value={newPassConfirm}
		/>
		<ValidationMessage
			message={newPasswordValidation?.message}
			isValid={newPasswordValidation?.isValid}
		/>
		<ValidationMessage
			message={passwordsMismatch ? "Passwords don't match!" : null}
			isError={true}
		/>
		<footer>
			<Button type="submit" disabled={isPasswordSubmitDisabled}>Update Password</Button>
			<FeedbackMessage message={passwordFeedback} />
		</footer>
	</form>

	<!-- Privacy -->
	<form onsubmit={updatePrivacy} class="flex flex-col gap-4">
		<h2 class="prose max-w-none mb-2">Privacy</h2>
		<div class="flex flex-col gap-2">
			<Checkbox
				name="Profile Public"
				legend="Profile Public"
				bind:checked={user.publicProfile}
				label="Profile Public"
				size="sm"
				color="primary"
			>
				Show or hide your profile from other users.
			</Checkbox>
			<Checkbox
				name="Recipes Public"
				bind:checked={user.publicRecipes}
				legend="Recipes Public"
				size="sm"
				color="primary"
			>
				Make your recipes public or private by default
			</Checkbox>
		</div>
		<footer>
			<Button type="submit">Update Privacy</Button>
			<FeedbackMessage message={privacyFeedback} />
		</footer>
	</form>
</div>
