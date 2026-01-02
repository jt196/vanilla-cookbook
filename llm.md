## LLM Feature Plan

1) **Provider Flexibility**
   - Env shape (generic-first): `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_TEXT_MODEL`, `LLM_IMAGE_MODEL`; optional overrides `LLM_TEXT_PROVIDER`, `LLM_IMAGE_PROVIDER`, plus provider-specific keys (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).
   - Dynamically import provider client so only installed providers are loaded; installation can be done per-deployment (Docker/entrypoint) instead of bundling all.
   - Surface current provider/model in UI (admin site settings) and pass selection through to server calls.

2) **Prompt-to-Recipe Creation**
   - In `RecipeNewScrape.svelte`, add mode toggle: paste text vs prompt → recipe generation (optional image generation).
   - Define backend endpoint to accept prompt, call configured text/image models, return recipe object (and optional image).
   - Handle UX states (loading, errors) and populate form with generated recipe.

3) **Directions Summarization**
   - In `src/routes/recipe/(private)/new/+page.svelte`, add button near directions to request summary via LLM.
   - Backend route to accept directions text and return concise summary; reflect loading/error in UI.

4) **Ingredient Cleanup**
   - Backend helper to LLM-format ingredient list to parser-friendly structure (guided by `index-eng.test.js` expectations).
   - UI affordance (button near ingredients) to trigger cleanup; merge result back into form.

5) **Cross-Cutting**
   - Centralize LLM client/config (text vs image) with provider selection and fallbacks.
   - Add minimal tests/mocks for new endpoints.
   - Document new env vars and flows.
