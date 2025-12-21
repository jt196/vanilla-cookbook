# AGENTS.md

Guidance for AI/code assistants working on Vanilla Cookbook, a SvelteKit recipe manager with Prisma (SQLite by default), PicoCSS styling, PWA support, and optional OpenAI/Anthropic-powered parsing help.

## Project Map
- `src/lib/` core logic; `components/` for UI pieces, `utils/` for parsing/import/image/PWA helpers, `submodules/` contains the ingredient parser git submodule at `src/lib/submodules/recipe-ingredient-parser`.
- `src/routes/` SvelteKit routes (`api/` endpoints, user-facing pages under `user/[id]/` etc.).
- `prisma/` schema and migrations; `src/lib/utils/seed/seed.js` seeds sample data.
- `static/` PWA assets; `docs/` holds manual + technical docs (`docs/technical/*.md`) and scripts to build docs/screenshots.
- Generated output lives in `build/` and `site/`; prefer editing source files and regenerate when needed.

## Setup
- Use `pnpm` (repo is engine-strict). After cloning, pull submodules: `git submodule update --init --recursive` (required for the ingredient parser).
- Copy `.env.template` to `.env`; set `ORIGIN=http://localhost:5173` for dev. Optional: `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` for AI assist, `VITE_APP_ROOT_PATH` if deploying under a sub-path.
- Install and prep: `pnpm dev:install` (installs deps + `prisma generate`). If schema changes, rerun `pnpm prisma generate`.

## Run / Build
- Dev server: `pnpm dev` (applies Prisma migrations, seeds, starts Vite). `pnpm dev:setup` pre-runs SW generation + migrations if needed.
- Service worker/PWA: `pnpm generate-sw` to rebuild, `./sw-domain.sh` to update SW scope when the host changes.
- Production: `pnpm build` (Prisma generate + SW + Vite), then `pnpm serve` (migrate deploy + seed + start Node adapter) or `pnpm start` (build then serve).

## Quality Gates
- Tests: `pnpm test` (Vitest + jsdom), `pnpm test:watch`, `pnpm coverage`.
- Lint/format: `pnpm lint` (Prettier check + ESLint) and `pnpm format`.
- Docs/screenshots: `pnpm docs:build` (calls `docs/scripts` for JSDoc + screenshots; requires Python deps per `docs/scripts/docs-requirements.txt` and a running dev server).

## Notes and Gotchas
- Keep the ingredient parser submodule in sync; changes there belong to the submodule repo/branch.
- Database is SQLite by default; migrations live under `prisma/migrations`. Use `pnpm prisma migrate dev` for new migrations during development.
- Uploads persist under `uploads/`; avoid deleting in scripts unless intentional.
- Optional AI features rely on configured API keys; default flows should work without them.
