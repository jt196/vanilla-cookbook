import { test, expect } from '@playwright/test'

test.setTimeout(120_000)

const admin = {
	username: 'e2e_admin',
	email: 'e2e_admin@example.com',
	password: 'E2Epassw0rd!'
}

const seededRecipes = [
	'Kewpie-Style Mayonnaise',
	'Spaghetti alla puttanesca',
	"Chef John's Fresh Salmon Cakes"
]

async function expectOk(response) {
	expect(response, 'Expected a response object').toBeTruthy()
	expect(response.ok(), `Expected ${response.url()} to be ok`).toBeTruthy()
}

async function assertPage(page, path, { heading, text, selector } = {}, projectName) {
	await test.step(`[${projectName}] ${path}`, async () => {
		const response = await page.goto(path, { waitUntil: 'networkidle' })
		await expectOk(response)
		const waitMs = 15000
		if (heading) {
			await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: waitMs })
		}
		if (text) {
			await expect(page.getByText(text, { exact: false })).toBeVisible({ timeout: waitMs })
		}
		if (selector) {
			await expect(page.locator(selector)).toBeVisible({ timeout: waitMs })
		}
	})
	console.log(`[${projectName}] PASS ${path}`)
}

test('fresh install admin seed, login, and page smoke tests', async ({ page }, testInfo) => {
	const failures = []
	const projectName = testInfo.project.name

	page.on('pageerror', (error) => {
		failures.push(`pageerror: ${error?.message || String(error)}`)
	})

	page.on('console', (msg) => {
		const type = msg.type()
		const text = msg.text()
		if (text.includes('Wake Lock error')) {
			return
		}
		if (type === 'error' || type === 'warning') {
			failures.push(`console.${type}: ${text}`)
		}
	})

	page.on('requestfailed', (request) => {
		const url = request.url()
		const method = request.method()
		const failure = request.failure()?.errorText || 'request failed'
		// Ignore aborted requests (happen during navigation, not real errors)
		if (failure === 'NS_BINDING_ABORTED' || failure === 'net::ERR_ABORTED') {
			return
		}
		failures.push(`requestfailed: ${method} ${url} - ${failure}`)
	})

	await page.goto('/', { waitUntil: 'networkidle' })

	const setupHeading = page.getByRole('heading', { name: 'Welcome to Vanilla Cookbook' })
	if (await setupHeading.isVisible()) {
		await expect(setupHeading).toBeVisible()

		await page.getByLabel('Username', { exact: true }).fill(admin.username)
		await page.getByLabel('Email', { exact: true }).fill(admin.email)
		await page.getByLabel('Password', { exact: true }).fill(admin.password)
		await page.getByLabel('Confirm Password', { exact: true }).fill(admin.password)

		const seedCheckbox = page.getByLabel('Add Sample Recipes')
		if (!(await seedCheckbox.isChecked())) {
			await seedCheckbox.check()
		}

		await page.getByRole('button', { name: 'Create Admin' }).click()
		await page.waitForURL('**/user/*/recipes')
	} else {
		await page.goto('/login', { waitUntil: 'networkidle' })
	}

	const loginField = page.getByLabel('Username or email')
	if (await loginField.isVisible()) {
		await loginField.fill(admin.username)
		await page.getByLabel('Password').fill(admin.password)
		await page.getByRole('button', { name: 'Login' }).click()
		await page.waitForURL('**/user/*/recipes')
	}

	const userId = new URL(page.url()).pathname.split('/')[2]

	for (const name of seededRecipes) {
		await expect(page.getByRole('link', { name })).toBeVisible()
	}

	const firstRecipeLink = page.getByRole('link', { name: seededRecipes[0] }).first()
	const firstRecipeHref = await firstRecipeLink.getAttribute('href')
	expect(firstRecipeHref).toBeTruthy()

	await assertPage(page, '/users', { heading: 'Vanilla Users' }, projectName)
	await assertPage(page, '/recipe/new', { heading: 'New Recipe' }, projectName)
	await assertPage(page, `/user/${userId}/shopping`, { heading: 'Shopping' }, projectName)
	await assertPage(page, `/user/${userId}/calendar`, { selector: '.ec' }, projectName)
	await assertPage(page, `/user/${userId}/options/settings`, { heading: 'Account' }, projectName)
	await assertPage(page, `/user/${userId}/options/recipes`, { text: 'Select language' }, projectName)
	await assertPage(
		page,
		`/user/${userId}/options/bookmark`,
		{
		text: 'Drag This Bookmark to Your Browser Toolbar'
		},
		projectName
	)
	await assertPage(page, `/user/${userId}/options/export`, { heading: 'Export Recipes' }, projectName)
	await assertPage(page, `/user/${userId}/options/import`, { heading: 'Import Recipes' }, projectName)
	await assertPage(
		page,
		`/user/${userId}/options/admin/site`,
		{ heading: 'Update Site Settings' },
		projectName
	)
	await assertPage(page, `/user/${userId}/options/admin/users`, { selector: 'table' }, projectName)

	await assertPage(page, firstRecipeHref, { heading: seededRecipes[0] }, projectName)

	// Test recipe edit flow - this catches issues like extra fields breaking Prisma updates
	await test.step(`[${projectName}] edit recipe`, async () => {
		// Navigate to first recipe view page
		await page.goto(firstRecipeHref, { waitUntil: 'networkidle' })
		await expect(page.getByRole('heading', { name: seededRecipes[0] })).toBeVisible({ timeout: 15000 })

		// Click the edit recipe link (not the edit images link)
		const editLink = page.locator('a[href*="/edit"]').first()
		await expect(editLink).toBeVisible({ timeout: 5000 })
		await editLink.click()
		await page.waitForURL('**/edit**', { timeout: 15000 })

		// Wait for the form to be ready
		const submitButton = page.getByRole('button', { name: 'Update Recipe' }).first()
		await expect(submitButton).toBeVisible({ timeout: 15000 })

		// Make a small change to the notes field
		const notesField = page.locator('textarea[name="notes"]')
		await expect(notesField).toBeVisible({ timeout: 5000 })
		const timestamp = new Date().toISOString()
		await notesField.fill(`E2E test edit - ${timestamp}`)

		// Submit the form
		await submitButton.click()

		// Verify redirect back to view page (indicates success)
		await page.waitForURL('**/view**', { timeout: 30000 })
		await expect(page.getByRole('heading', { name: seededRecipes[0] })).toBeVisible({ timeout: 15000 })
	})
	console.log(`[${projectName}] PASS edit recipe`)

	if (failures.length > 0) {
		throw new Error(`Runtime errors detected:\\n${failures.join('\\n')}`)
	}
})
