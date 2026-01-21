# E2E Smoke Tests

## What we're testing

This suite is a fresh-install smoke test that validates the core user flow and page availability:

- Creates an admin user via the first-run setup screen (the `/` seed flow).
- Logs in and verifies the three seeded sample recipes exist.
- Loads key pages to ensure they render without errors.
- Loads the first recipe view page.
- Fails on runtime issues (page errors, console warnings/errors, or failed network requests).

## How to run

From the project root:

```bash
pnpm exec playwright test
```

This uses the Playwright webServer config to:

- create a temp SQLite database in `tests/.tmp/`
- run migrations + seed
- build the app
- start the Node server on `http://127.0.0.1:4173`

## How to add new pages to the smoke test

Edit `src/tests/e2e/admin-seed.spec.js` and add another `assertPage(...)` call after login.

Example:

```js
await assertPage(page, `/user/${userId}/shopping`, { heading: 'Shopping' })
```

You can assert one of:

- `heading`: an exact heading text
- `text`: any visible text (partial matches allowed)
- `selector`: a CSS selector

Keep pages that cause known noisy requests (e.g. missing endpoints) out of the smoke list unless you also add an allowlist for those expected errors.
