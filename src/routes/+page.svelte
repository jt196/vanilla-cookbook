<script>
	import { goto } from '$app/navigation'
	import Spinner from '$lib/components/Spinner.svelte'
	import { systems, languages } from '$lib/utils/config.js'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	let { data } = $props()
	const { dbSeed } = data

	let adminName = $state('')
	let adminUsername = $state('')
	let adminUnits = $state('metric')
	let adminLanguage = $state('eng')
	let adminEmail = $state('')
	let adminPassword = $state('')
	let recipeSeed = $state('true')

	let spinnerVisible = $state(false)

	async function handleSubmit(event) {
		event.preventDefault()
		spinnerVisible = true // Show the spinner

		const formData = {
			adminUser: {
				adminName,
				adminUsername,
				adminEmail,
				adminPassword,
				adminLanguage,
				adminUnits,
				recipeSeed
			}
		}

		try {
			const res = await fetch('/api/site/seed', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			})
			const result = await res.json()
			if (res.ok && result.success) {
				spinnerVisible = false // Hide the spinner before redirecting
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
		<Input type="text" id="name" label="Name" bind:value={adminName} name="name" required />
		<Input type="text" id="username" label="Username" bind:value={adminUsername} name="username" required />
		<Input type="email" id="email" label="Email" bind:value={adminEmail} name="email" required />
		<Input type="password" id="password" label="Password" bind:value={adminPassword} name="password" required />
		<label data-tooltip="Seed database with sample recipes">
			<input type="checkbox" bind:checked={recipeSeed} />
			Add Sample Recipes
		</label>
		<details class="dropdown">
			<summary>Units</summary>
			<ul>
				{#each systems as system}
					<li>
						<label>
							<input
								type="radio"
								bind:group={adminUnits}
								name="system"
								value={system.value}
								checked={system.value === adminUnits} />
							{system.label}
						</label>
					</li>
				{/each}
			</ul>
		</details>
		<details class="dropdown">
			<summary>Language</summary>
			<ul>
				{#each languages as language}
					<li>
						<label>
							<input
								type="radio"
								bind:group={adminLanguage}
								name="language"
								value={language.value}
								checked={language.value === adminLanguage} />
							{language.label}
						</label>
					</li>
				{/each}
			</ul>
		</details>
		<br />
		<Button type="submit">Create Admin</Button>
	</form>
{:else}
	<h1>Something went wrong!</h1>
{/if}

<!-- Pass the spinner snippet as a prop -->
<Spinner visible={spinnerVisible} spinnerContent="Creating Admin User..." />
