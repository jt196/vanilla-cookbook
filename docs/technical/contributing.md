# Contributing Guide

This guide explains how to contribute changes that are easy to review, test, and include in release notes.

## Workflow

1. Create a branch from `main`.
2. Implement your change with focused commits.
3. Open a pull request.
4. Fill in `.github/pull_request_template.md`, especially `## Release Notes`.
5. Apply at least one release label.
6. Run relevant tests and include results in the PR.

## Pull Request Requirements

Use the PR template sections:

- `## Summary`: technical overview of the change.
- `## Release Notes`: user-facing bullets.
- `## Testing`: what you ran and what passed.

The `## Release Notes` section should be concise and readable for end users.

## Labels and Release Notes

Release notes are drafted automatically with Release Drafter using:

- `.github/release-drafter.yml`
- `.github/workflows/release-drafter.yml`

### Labels currently used

- `enhancement`: new capability/improvement
- `bug`: bug fix
- `documentation`: docs-only changes
- `breaking`: breaking change (major bump)
- `skip-changelog`: exclude PR from release notes

Other default labels (`question`, `help wanted`, `duplicate`, `invalid`, `wontfix`) are categorized/excluded per config.

If labels are missing in GitHub UI, create them in **Issues > Labels**.

## How Release Drafter Uses PRs

Draft release entries include:

- PR title
- PR link/author
- PR body content (from your template)

This is why clear PR titles and a completed `## Release Notes` section are important.

## Testing Expectations

Run only what is relevant, but include enough confidence for reviewers.

Common commands:

```bash
pnpm test
pnpm -s vitest run src/tests/ai.unit.test.js src/tests/ai.routes.test.js
```

Optional live provider checks (token usage):

```bash
RUN_LLM_SMOKE=true pnpm -s vitest run src/tests/llm.smoke.test.js
```

Live smoke tests are optional and intended for connectivity checks, not full functional coverage.

## Documentation and Linting

- Update docs when behavior or setup changes.
- Keep edited markdown compliant with `.markdownlint.json`.

```bash
pnpm -s dlx markdownlint-cli docs/technical/contributing.md
```

## Commit and Merge

- Keep PRs scoped and readable.
- Prefer clear PR titles (they are shown in generated release notes).
- Ensure CI is green before merge.
