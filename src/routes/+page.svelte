<script>
	import { goto } from '$app/navigation'

	let { data } = $props()
	const { dbSeed } = data

	let adminName = $state('')
	let adminUsername = $state('')
	let adminEmail = $state('')
	let adminPassword = $state('')
	let recipeSeed = $state('true')

	async function handleSubmit(event) {
		event.preventDefault() // extra safety if needed
		const formData = {
			adminUser: { adminName, adminUsername, adminEmail, adminPassword, recipeSeed }
		}
		try {
			const res = await fetch('/api/site/seed', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			})
			const result = await res.json()
			if (res.ok && result.success) {
				goto(`/login`)
			} else {
				console.error('Error seeding DB:', result.error)
			}
		} catch (error) {
			console.error('Error:', error)
		}
	}
</script>

{#if !dbSeed}
	<form onsubmit={handleSubmit} method="POST">
		<hgroup>
			<h2>Welcome to Vanilla Cookbook</h2>
			<h3>Let's get cooking! Create your account:</h3>
		</hgroup>
		<label for="name">Name</label>
		<input type="text" id="name" bind:value={adminName} name="name" required />
		<label for="username">Username</label>
		<input type="text" id="username" bind:value={adminUsername} name="username" required />
		<label for="email">Email</label>
		<input type="email" id="email" bind:value={adminEmail} name="email" required />
		<label for="password">Password</label>
		<input type="password" id="password" bind:value={adminPassword} name="password" required />
		<label data-tooltip="Seed database with sample recipes">
			<input type="checkbox" bind:checked={recipeSeed} />
			Add Sample Recipes
		</label>
		<br />
		<button type="submit">Create Admin</button>
	</form>
{:else}
	<h1>Something went wrong!</h1>
{/if}
