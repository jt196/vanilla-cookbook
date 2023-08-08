import { expect, test } from '@playwright/test'

/**
 * Test to verify the content of the h1 element on the index page.
 *
 * @param {Object} context - The test context.
 * @param {import('@playwright/test').Page} context.page - The page object from Playwright.
 */
test('index page has expected h1', async ({ page }) => {
	await page.goto('/')
	expect(await page.textContent('h1')).toBe('Welcome to SvelteKit')
})
