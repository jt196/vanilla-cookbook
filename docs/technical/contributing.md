# Contributing Guide

This guide explains how to contribute changes that are easy to review, test, and include in release notes.

## Workflow

1. Create a branch from `main`.
2. Run local checks (see below) before pushing.
3. Implement your change with focused commits.
4. Open a pull request.
5. The template for the notes is in `.github/pull_request_template.md`.
6. Apply at least one release label.
7. Wait for CI checks to pass.
8. If they fail, push updates to the PR to fix them before they can be merged.

## PRs

- Keep PRs scoped and readable.
- Prefer clear PR titles (they are shown in generated release notes).
- Keep PR body to `## Release Notes` bullets only (using `.github/pull_request_template.md`).

## CI Behavior

- PRs to `main`: run test suite without Playwright E2E.
- Push to `main`: run test suite without Playwright E2E, then build/publish `latest` Docker image.
- Published release: run full suite including Playwright E2E before stable Docker build.

## Local Testing

Try testing the code you changed first:

```bash
pnpm -s vitest run src/tests/ai.unit.test.js src/tests/ai.routes.test.js
```

If the scoped tests pass, run the global tests:

```bash
pnpm test
```

If your change affects LLM connectivity, you can optionally run a live provider connectivity check.

Note: only runs when relevant API keys are present in local `.env`.

```bash
RUN_LLM_SMOKE=true pnpm -s vitest run src/tests/llm.smoke.test.js
```

## Documentation and Linting

- Update docs when behavior or setup changes.
- Keep edited markdown compliant with `.markdownlint.json`.

```bash
pnpm -s dlx markdownlint-cli docs/technical/contributing.md
```

## UI Translations

UI copy lives in `src/lib/i18n/en.js`. This English file is the source of truth for all other locale files in `src/lib/i18n/`.

The app language selector options come from `src/lib/utils/config.js`, which in turn derives from `languageLabels` in the ingredient parser submodule. The locale registry used by the UI translator lives in `src/lib/i18n/index.js`.

When you add or rename UI keys:

1. Update `src/lib/i18n/en.js`.
2. Regenerate locale files with the incremental generator:

```bash
pnpm i18n:generate --provider=google
```

Useful flags:

- `--langs=deu,ita,...` limits generation to specific languages.
- `--namespaces=common,nav,...` limits generation to specific top-level namespaces.
- `--overwrite` forces regeneration even when a namespace already looks current.

Generator behavior:

- It only submits missing, stale, shape-mismatched, or still-English namespaces.
- It validates key shape and placeholder tokens such as `{count}` and `{name}`.
- It retries automatically when the model returns invalid JSON or drops placeholders.

After generation:

1. Spot-check the changed locale files for obviously bad output.
2. Run:

```bash
pnpm exec svelte-check --fail-on-warnings
```

If you are adding support for a brand new language rather than updating existing locale files:

1. Add the language to the ingredient parser language metadata so it appears in `languageLabels`.
2. Add the matching locale module in `src/lib/i18n/`.
3. Register it in `src/lib/i18n/index.js`.
4. Confirm it appears in the settings language dropdown via `src/lib/utils/config.js`.
