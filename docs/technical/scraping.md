# Scraping Flow

Recipe scraping follows a layered extraction path so users can paste a URL and still get a usable draft even when the source page is inconsistent.

See also: `docs/technical/scrape-compatibility.md` for the current site compatibility matrix and latest sweep results.

## Data Flow

1. `GET /api/recipe/scrape/[url]` calls `parseURL(url)`.
2. `parseURL` downloads the page HTML and passes it to `parseHTML`.
3. `parseHTML` calls `parseRecipe`, which extracts recipe data in this order:
   1. JSON-LD (`parseJSONLD`)
   2. Site-specific selectors (`parseUsingSiteConfig`) when structured data is incomplete
   3. Generic microdata extraction (`extractMicrodata`) as a final HTML-based fallback
4. The route returns:
   - `_status: "complete"` when name and ingredients are present
   - `_status: "partial"` when only some recipe fields could be extracted
5. If HTML was fetched and the regular scrape is incomplete or throws, the route can optionally try the LLM HTML fallback.

## Fallback Rules

- Structured data stays the primary source of truth.
- Site configuration and microdata are used to fill missing fields, not blindly replace good structured data.
- Partial scraper results are returned as structured recipe objects so the new-recipe form can still be populated for manual review.
- If the upstream site blocks the fetch entirely, the route returns the upstream HTTP failure instead of pretending the page parsed successfully.

## Operational Notes

- Some sites, including Allrecipes, can return anti-bot or access-control pages to server-side fetches even when the same URL renders normally in a browser session.
- In those cases, HTML-based fallback is only possible if the real page HTML was actually fetched.
- The local parser tests use saved fixtures in `src/lib/data/recipe_html/`, so they validate parser behavior against known markup snapshots, not current live site accessibility.

## Test Workflow

Fixture-backed parser tests should be the default for real-site regressions.

### Current Setup

- Saved HTML fixtures live in `src/lib/data/recipe_html/`.
- `src/tests/recipeParse.test.js` uses `mockFetchForURL()` to map a URL to a saved fixture file.
- The strict regression corpus is the manifest subset where `status_class === "active"`.
- A separate fixture smoke test parses every saved HTML file in `src/lib/data/recipe_html/` so the directory does not drift away from test coverage.
- Inline HTML tests in `src/tests/recipeParse.test.js` are still useful, but only for narrow parser-shape cases that are awkward to express with a full saved page snapshot.

These fixture-backed tests run under the normal `pnpm test` suite, so CI already exercises the saved HTML corpus.

### Coverage Goal

- Every saved file in `src/lib/data/recipe_html/` should be exercised by at least the fixture smoke test.
- Real regressions should also be represented in the stronger URL-backed parser corpus, not left as fixture-only references.

## Compatibility Workflow

The fixture-backed tests and the live compatibility sweep answer different questions and should not be conflated.

- Fixture-backed parser tests check whether Vanilla can still parse a saved snapshot of known markup.
- The live compatibility sweep checks whether the current upstream site still returns usable HTML to Vanilla right now.
- Optional LLM validation checks whether the HTML fallback can recover a usable recipe object when the regular scraper is incomplete.

This matters because historical passing lists are not current live truth. A site can move behind anti-bot protection and still remain useful as a parser fixture.

### Canonical Files

- Input manifest: `src/lib/data/compatibility/scrape-compatibility.manifest.json`
- Latest machine-readable results: `src/lib/data/compatibility/scrape-compatibility.latest.json`
- Latest generated report: `docs/technical/scrape-compatibility.md`
- Optional local candidate diff: `src/lib/data/compatibility/recipe-scrapers.diff.json`

The Markdown report is the easiest place to check current support, blocked domains, parser gaps, and fallback behavior at a glance.

The manifest JSON is now the canonical URL corpus. `downloadRecipes.js` is only a small helper for reading that manifest, appending URLs, and saving fixtures.

### Commands

- Bootstrap the manifest from the legacy URL lists:
  - `pnpm compatibility:manifest`
- Generate a reviewable diff against recipe-scrapers supported sites:
  - `pnpm compatibility:diff`
- Run the live compatibility sweep for active URLs:
  - `pnpm compatibility:scrape -- --status active`
- Run the live compatibility sweep for the full corpus:
  - `pnpm compatibility:scrape -- --status all`
- Refresh saved fixtures from live responses while sweeping:
  - `pnpm compatibility:scrape -- --status active --refresh-fixtures`
- Run the optional LLM fallback stage when provider credentials are configured:
  - `pnpm compatibility:scrape -- --status active --llm`
- Re-run the LLM fallback only for URLs that failed or were partial in the previous results file:
  - `pnpm compatibility:scrape -- --status all --llm --only-failed`
- Add a single URL to the manifest and immediately run the compatibility workflow for that URL:
  - `pnpm compatibility:scrape -- --add-url --url https://example.com/recipe --status-class active --notes "New regression candidate"`

The live compatibility sweep is intentionally separate from normal CI. It is an on-demand workflow because it depends on upstream availability and, when enabled, can incur LLM cost.

### Compatibility Stages

1. Live fetch
   - Uses the same request headers as `downloadHTML()`.
   - Records HTTP status, final URL, content type, and whether any HTML body was captured.
2. Vanilla scrape
   - Parses either the captured HTML body or the existing saved fixture.
   - Records whether the result is `complete`, `partial`, or `failed`.
3. Optional LLM fallback
   - Only runs when `--llm` is passed and provider credentials are available.
   - Only runs when HTML exists and the regular scrape is incomplete or failed.
   - `--only-failed` narrows the run to URLs that were already incomplete or failed in the previous results JSON.
4. Report generation
   - Writes the JSON results payload.
   - Regenerates the Markdown compatibility table.

### Report Fields

The generated compatibility table includes both transport-level and extraction-level signals.

- `Live fetch` and `HTTP` show current upstream accessibility.
- `Name` records whether a recipe name was extracted.
- `Ingredients` is the extracted ingredient line count.
- `Instructions` is the extracted instruction step count.
- `Instruction chars` is a lightweight quality signal for direction length.
- `Vanilla scrape` remains the coarse overall status: `complete`, `partial`, or `failed`.
- `Site config` shows whether that domain currently has selectors in `siteConfigurations.js`.
- `Diagnosis` is a derived hint that separates upstream blocking from parser gaps and parser exceptions.

The generated diff JSON is intentionally not applied automatically. Review it first, then track worthwhile domains with `pnpm compatibility:track`. It is treated as a local review artifact rather than a canonical committed dataset.

### Workflow For Adding Or Refreshing A Site

Use one command:

`pnpm compatibility:track -- --url https://example.com/recipe --status-class active --notes "New regression candidate"`

That command:

1. Adds or updates the URL in the manifest.
2. Fetches the live page.
3. Saves the fixture HTML.
4. Re-runs compatibility for that URL.
5. Updates the JSON results and Markdown report.

Then run:

`pnpm test -- run src/tests/recipeParse.test.js src/tests/scrape.routes.test.js src/tests/compatibility.test.js`

`pnpm compatibility:manifest` is only needed for bootstrap or larger normalization passes.

### Scope Boundaries

- Bookmarklet and browser-assisted import validation remain manual. The compatibility sweep only measures server fetches, parser behavior on saved or captured HTML, and optional LLM fallback.
- Non-2xx responses can still feed the LLM fallback if they returned HTML.
- Anti-bot pages may still produce an LLM attempt that is technically successful but useless because the page contains no recipe data.

### Recommended Workflow For Scrape Fixes

1. Reproduce the failure on the live site or with an existing saved fixture.
2. Track or refresh the site with:
   `pnpm compatibility:track -- --url https://example.com/recipe --status-class active`
3. Use `--status-class active` if the site should stay under the strict fixture-backed parser test.
4. Fix the parser using the smallest reasonable change:
   - Prefer structured-data parsing fixes first.
   - Use site-specific selectors only when the page markup genuinely requires them.
   - A site config can still be useful for saved fixtures or bookmarklet/browser-captured HTML even if the live server fetch is blocked upstream.
   - Keep inline tests for data-shape edge cases, not as a replacement for a real fixture.
5. Run `pnpm test -- run src/tests/recipeParse.test.js`.

## LLM Fallback Conditions

- The scrape route first tries regular extraction through `parseURL()`.
- If regular extraction is incomplete or fails, the route should still attempt LLM HTML fallback whenever any response body was captured from the upstream request.
- This includes non-2xx upstream responses if they still returned an HTML body.
- LLM fallback may still be ineffective on anti-bot or access-control pages because those pages often contain no recipe content, only a block message.
- If no HTML body is available at all, the route cannot attempt HTML-based LLM fallback.

### When Inline HTML Is Acceptable

- To cover JSON-LD shape changes such as nested `HowToSection` or inconsistent field types.
- To test merge behavior between JSON-LD, site selectors, and microdata.
- To isolate a parser bug without introducing a large fixture that adds no new site-specific coverage.

## To Do

- Investigate the remaining non-complete compatibility rows and decide whether each is a parser fix, a site-config fix, or an upstream-blocked/manual-only case.
- Review whether any of the newer `legacy_reference` sites should be promoted to `active` for stricter CI regression coverage.
- Replace or remove weak tracked URLs that are not true recipe pages or are effectively member-only.
- Decide whether the fixture smoke test should log or explicitly classify the current legacy `Invalid URL` fixture cases more cleanly.
- Revisit domain expansion later with `pnpm compatibility:diff` and add new sites selectively rather than trying to cover the full upstream corpus at once.
