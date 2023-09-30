<script>
	import Edit from '$lib/components/svg/Edit.svelte'
	import { onMount } from 'svelte'

	export let data
	const { users } = data
	let isDialogOpen = false // dialog is initially closed

	let editingUser = {}

	function handleEdit(userId) {
		editingUser = users.find((user) => user.id === userId)
		console.log('🚀 ~ file: +page.svelte:13 ~ handleEdit ~ editingUser:', editingUser)
		toggleDialog()

		if (editingUser) {
			console.log('User found:', editingUser)
		} else {
			console.log('User not found.')
		}
	}

	let dialog

	onMount(() => {
		if (isDialogOpen) {
			dialog.showModal()
		}
		dialog.addEventListener('close', () => {
			isDialogOpen = false
		})
	})

	function toggleDialog() {
		if (isDialogOpen) {
			dialog.close()
			isDialogOpen = false
		} else {
			dialog.showModal()
			isDialogOpen = true
		}
	}
</script>

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
						on:click={() => handleEdit(user.id)}
						data-testid="delete-button"
						class="outline secondary">
						<Edit width="20px" fill="white" />
					</button></td>
			</tr>
		{/each}
	</tbody>
</table>

<dialog bind:this={dialog}>
	<article>
		<h2>Change User Settings</h2>
		<label for="name"> Name </label>
		<input type="text" id="name" name="name" bind:value={editingUser.name} />

		<label for="source"> Username </label>
		<input type="text" id="source" name="source" bind:value={editingUser.username} />
		<label for="source"> Email </label>
		<input type="text" id="source" name="source" bind:value={editingUser.email} />
		<label for="source"> About </label>
		<input type="text" id="source" name="source" bind:value={editingUser.about} />
		<footer>
			<button on:click={toggleDialog} class="secondary"> Cancel </button>
			<button>Confirm</button>
		</footer>
	</article>
</dialog>
