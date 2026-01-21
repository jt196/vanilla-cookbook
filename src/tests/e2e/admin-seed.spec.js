import { test, expect } from '@playwright/test'

test.setTimeout(120_000)

const admin = {
	name: 'E2E Admin',
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
		failures.push(`requestfailed: ${method} ${url} - ${failure}`)
	})

	await page.goto('/', { waitUntil: 'networkidle' })

	const setupHeading = page.getByRole('heading', { name: 'Welcome to Vanilla Cookbook' })
	if (await setupHeading.isVisible()) {
		await expect(setupHeading).toBeVisible()

		await page.getByLabel('Name', { exact: true }).fill(admin.name)
		await page.getByLabel('Username', { exact: true }).fill(admin.username)
		await page.getByLabel('Email', { exact: true }).fill(admin.email)
		await page.getByLabel('Password', { exact: true }).fill(admin.password)
		await page.getByLabel('Confirm Password', { exact: true }).fill(admin.password)

		const seedCheckbox = page.getByLabel('Add Sample Recipes')
		if (!(await seedCheckbox.isChecked())) {
			await seedCheckbox.check()
		}

		await page.getByRole('button', { name: 'Create Admin' }).click()
		await page.waitForURL('**/login')
	} else {
		await page.goto('/login', { waitUntil: 'networkidle' })
	}

	await page.getByLabel('Username or email').fill(admin.username)
	await page.getByLabel('Password').fill(admin.password)
	await page.getByRole('button', { name: 'Login' }).click()

	await page.waitForURL('**/user/*/recipes')

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
	await assertPage(page, `/user/${userId}/options/settings`, { heading: 'Ingredients' }, projectName)
	await assertPage(page, `/user/${userId}/options/password`, { heading: 'Update Password' }, projectName)
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

	if (failures.length > 0) {
		throw new Error(`Runtime errors detected:\\n${failures.join('\\n')}`)
	}
})
