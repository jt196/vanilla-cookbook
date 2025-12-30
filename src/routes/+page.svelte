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
	<div class="flex justify-center items-start min-h-[80vh] pt-8">
		<div class="card w-full max-w-lg bg-base-200 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-3xl">Welcome to Vanilla Cookbook</h2>
				<p class="text-base-content/70 mb-4">Let's get cooking! Create your account:</p>

				<form onsubmit={handleSubmit} method="POST" class="space-y-4">
					<Input type="text" id="name" label="Name" bind:value={adminName} name="name" required />
					<Input type="text" id="username" label="Username" bind:value={adminUsername} name="username" required />
					<Input type="email" id="email" label="Email" bind:value={adminEmail} name="email" required />
					<Input type="password" id="password" label="Password" bind:value={adminPassword} name="password" required />

					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" bind:checked={recipeSeed} class="checkbox checkbox-primary" />
						<span class="label-text">Add Sample Recipes</span>
					</label>

					<div class="form-control">
						<label class="label">
							<span class="label-text">Units</span>
						</label>
						<select class="select select-bordered w-full" bind:value={adminUnits}>
							{#each systems as system}
								<option value={system.value}>{system.label}</option>
							{/each}
						</select>
					</div>

					<div class="form-control">
						<label class="label">
							<span class="label-text">Language</span>
						</label>
						<select class="select select-bordered w-full" bind:value={adminLanguage}>
							{#each languages as language}
								<option value={language.value}>{language.label}</option>
							{/each}
						</select>
					</div>

					<div class="card-actions justify-end mt-6">
						<Button type="submit" class="w-full">Create Admin</Button>
					</div>
				</form>
			</div>
		</div>
	</div>
{:else}
	<div class="flex justify-center items-center min-h-[60vh]">
		<div class="alert alert-error max-w-md">
			<h1 class="text-xl font-bold">Something went wrong!</h1>
		</div>
	</div>
{/if}

<Spinner visible={spinnerVisible} spinnerContent="Creating Admin User..." />
