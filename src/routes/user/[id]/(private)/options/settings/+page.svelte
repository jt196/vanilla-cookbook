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
	import { get } from 'svelte/store'
	import { t } from '$lib/stores/locale.js'

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
	let passwordFeedbackCode = $state(null)
	let passwordFeedbackVars = $state({})

	// Privacy settings
	let privacyFeedback = $state('')
	let visibilityFeedback = $state('')
	let visibilityFeedbackCode = $state(null)
	let visibilityFeedbackVars = $state({})
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
		const tFn = get(t)
		const response = await fetch(`/api/user/${user.userId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...user, email })
		})
		if (response.ok) {
			accountFeedback = tFn('settings.msg.accountUpdated')
		} else {
			accountFeedback = tFn('settings.msg.accountUpdateFail')
		}
	}

	async function updatePassword(event) {
		event.preventDefault()
		passwordFeedback = ''
		passwordFeedbackCode = null
		passwordFeedbackVars = {}

		if (passwordsMismatch) {
			passwordFeedbackCode = 'settings.msg.passwordMismatch'
			return
		}

		if (newPasswordValidation && !newPasswordValidation.isValid) {
			passwordFeedback = newPasswordValidation.message
			passwordFeedbackCode = newPasswordValidation.messageCode
			passwordFeedbackVars = newPasswordValidation.messageVars || {}
			return
		}

		const response = await fetch(`/api/user/${user.userId}/password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ oldPass, newPass, newPassConfirm })
		})

		if (response.ok) {
			const responseData = await response.json().catch(() => null)
			passwordFeedback = responseData?.message || ''
			passwordFeedbackCode = responseData?.code || 'settings.msg.passwordUpdated'
			passwordFeedbackVars = responseData?.vars || {}
			oldPass = ''
			newPass = ''
			newPassConfirm = ''
		} else {
			try {
				const responseData = await response.json()
				if (response.status === 401) {
					passwordFeedback = responseData.error || ''
					passwordFeedbackCode = responseData.code || 'settings.msg.passwordIncorrect'
					passwordFeedbackVars = responseData.vars || {}
				} else {
					passwordFeedback = responseData.error || ''
					passwordFeedbackCode = responseData.code || 'settings.msg.passwordUpdateFail'
					passwordFeedbackVars = responseData.vars || {}
				}
			} catch (e) {
				passwordFeedback = ''
				passwordFeedbackCode = 'settings.msg.passwordUpdateFail'
				passwordFeedbackVars = {}
			}
		}
	}

	async function updatePrivacy(event) {
		event.preventDefault()
		const tFn = get(t)
		const response = await fetch(`/api/user/${user.userId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(user)
		})
		if (response.ok) {
			privacyFeedback = tFn('settings.msg.privacyUpdated')
		} else {
			privacyFeedback = tFn('settings.msg.privacyUpdateFail')
		}
	}

	async function makeAllRecipesPrivate() {
		const tFn = get(t)
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
				visibilityFeedback = payload?.message || ''
				visibilityFeedbackCode = payload?.code || 'settings.msg.allPrivate_other'
				visibilityFeedbackVars = payload?.vars || {}
			} else {
				visibilityFeedback = payload?.error || ''
				visibilityFeedbackCode = payload?.code || 'settings.msg.visibilityFail'
				visibilityFeedbackVars = payload?.vars || {}
			}
		} finally {
			setPrivateBusy = false
		}
	}

	async function makeAllRecipesPublic() {
		const tFn = get(t)
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
				visibilityFeedback = payload?.message || ''
				visibilityFeedbackCode = payload?.code || 'settings.msg.allPublic_other'
				visibilityFeedbackVars = payload?.vars || {}
			} else {
				visibilityFeedback = payload?.error || ''
				visibilityFeedbackCode = payload?.code || 'settings.msg.visibilityFail'
				visibilityFeedbackVars = payload?.vars || {}
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
		<Button id="logout" formaction="/logout" type="submit" class="w-auto">{$t('nav.logout')}</Button
		>
	</form>

	<!-- Account Info -->
	<div class="prose max-w-none">
		<p class="mb-1">{$t('settings.recipeStats')}</p>
		<Table size="sm" bordered={true} containerClass="max-w-sm">
			<TableBody>
				<TableRow>
					<TableCell tag="th" scope="row">{$t('settings.total')}</TableCell>
					<TableCell>{recipeStats?.total ?? dbRecordCount}</TableCell>
				</TableRow>
				<TableRow>
					<TableCell tag="th" scope="row">{$t('settings.public')}</TableCell>
					<TableCell>{recipeStats?.public ?? 0}</TableCell>
				</TableRow>
				<TableRow>
					<TableCell tag="th" scope="row">{$t('settings.private')}</TableCell>
					<TableCell>{recipeStats?.private ?? 0}</TableCell>
				</TableRow>
				<TableRow>
					<TableCell tag="th" scope="row">{$t('settings.cooked')}</TableCell>
					<TableCell>{recipeStats?.cooked ?? 0}</TableCell>
				</TableRow>
				<TableRow>
					<TableCell tag="th" scope="row">{$t('settings.favourites')}</TableCell>
					<TableCell>{recipeStats?.favourites ?? 0}</TableCell>
				</TableRow>
			</TableBody>
		</Table>
		<p class="mt-2">
			{$t('common.version')} <i>{data.version}</i>
		</p>
	</div>

	<!-- Account Details -->
	<form onsubmit={updateAccount} class="flex flex-col gap-4">
		<h2 class="prose max-w-none mb-2">{$t('settings.account')}</h2>
		<Input type="text" id="username" label={$t('auth.username')} value={user.username} disabled />
		<Input
			type="email"
			id="email"
			label={$t('auth.email')}
			placeholder={$t('auth.emailAddress')}
			bind:value={email}
		/>
		<footer>
			<Button type="submit">{$t('settings.updateAccount')}</Button>
			<FeedbackMessage message={accountFeedback} />
		</footer>
	</form>

	<!-- Password Change -->
	<form onsubmit={updatePassword} class="flex flex-col gap-4">
		<h2 class="prose max-w-none mb-2">{$t('settings.changePassword')}</h2>
		{#if passwordRequirementsDescription}
			<p class="text-sm text-base-content/70">{passwordRequirementsDescription}</p>
		{/if}
		<Input
			type="password"
			id="old"
			label={$t('auth.currentPassword')}
			placeholder={$t('auth.currentPassword')}
			bind:value={oldPass}
		/>
		<Input
			type="password"
			id="new"
			label={$t('auth.newPassword')}
			placeholder={$t('auth.newPassword')}
			bind:value={newPass}
		/>
		<Input
			type="password"
			id="confirm"
			label={$t('auth.confirmNewPassword')}
			placeholder={$t('auth.confirmNewPassword')}
			bind:value={newPassConfirm}
		/>
		<ValidationMessage
			message={newPasswordValidation?.message}
			messageCode={newPasswordValidation?.messageCode}
			messageVars={newPasswordValidation?.messageVars}
			isValid={newPasswordValidation?.isValid}
		/>
		<ValidationMessage
			messageCode={passwordsMismatch ? 'settings.msg.passwordMismatch' : null}
			isError={true}
		/>
		<footer>
			<Button type="submit" disabled={isPasswordSubmitDisabled}
				>{$t('settings.updatePassword')}</Button
			>
			<FeedbackMessage
				message={passwordFeedback}
				messageCode={passwordFeedbackCode}
				messageVars={passwordFeedbackVars}
			/>
		</footer>
	</form>

	<!-- Privacy -->
	<h2 class="prose max-w-none mb-2">{$t('settings.privacy')}</h2>
	<form onsubmit={updatePrivacy} class="flex flex-col gap-4">
		<div class="flex flex-col gap-2">
			<Checkbox
				name="Profile Privacy"
				legend={$t('settings.profilePrivacy')}
				bind:checked={user.publicProfile}
				size="sm"
				color="primary"
			>
				{user.publicProfile ? $t('settings.profileVisible') : $t('settings.profileHidden')}
			</Checkbox>
			<Checkbox
				name="Recipe Privacy"
				bind:checked={user.publicRecipes}
				legend={$t('settings.recipePrivacy')}
				size="sm"
				color="primary"
			>
				{user.publicRecipes
					? $t('settings.recipesPublicDefault')
					: $t('settings.recipesPrivateDefault')}
			</Checkbox>
		</div>
		<footer>
			<Button type="submit">{$t('settings.updatePrivacy')}</Button>
			<FeedbackMessage message={privacyFeedback} />
		</footer>
	</form>

	<!-- Recipe Visibility Actions -->
	<div class="flex flex-col gap-2">
		<p class="text-sm text-base-content/70">{$t('settings.makeAllPrivateHint')}</p>
		<div>
			<Button
				type="button"
				color="error"
				style="outline"
				loading={setPrivateBusy}
				onclick={() => openVisibilityConfirm('private')}>{$t('settings.makeAllPrivate')}</Button
			>
			<Button
				type="button"
				color="success"
				style="outline"
				loading={setPrivateBusy}
				class="ml-2"
				onclick={() => openVisibilityConfirm('public')}>{$t('settings.makeAllPublic')}</Button
			>
		</div>
		<FeedbackMessage
			message={visibilityFeedback}
			messageCode={visibilityFeedbackCode}
			messageVars={visibilityFeedbackVars}
		/>
	</div>
</div>

<ConfirmationDialog
	bind:isOpen={confirmVisibilityOpen}
	onClose={closeVisibilityConfirm}
	onConfirm={confirmVisibilityAction}
>
	{#snippet content()}
		<h3 class="font-bold text-lg">{$t('settings.confirmVisibilityTitle')}</h3>
		{#if visibilityAction === 'public'}
			<p class="py-4">
				{$t('settings.confirmMakePublic')}
			</p>
		{:else if visibilityAction === 'private'}
			<p class="py-4">
				{$t('settings.confirmMakePrivate')}
			</p>
		{/if}
	{/snippet}
</ConfirmationDialog>
