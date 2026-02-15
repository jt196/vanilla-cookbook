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
