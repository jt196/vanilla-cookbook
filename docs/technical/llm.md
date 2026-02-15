# LLM and Embeddings Technical Overview

This document describes how Vanilla Cookbook connects to LLM providers, where those calls are used in the product, and how the codebase tests LLM-backed behavior without excessive token usage.

## 1) What We Use To Connect To LLMs

### Core chat stack

- Main runtime: `src/lib/utils/ai.js`
- Abstraction: LangChain chat clients loaded dynamically per provider
- Message types: `@langchain/core/messages` (`SystemMessage`, `HumanMessage`)

### Supported providers (chat)

- OpenAI: `@langchain/openai`
- Anthropic: `@langchain/anthropic`
- Google Gemini: `@langchain/google-genai`
- Ollama: `@langchain/ollama`

Provider/model catalogs and selection helpers live in:

- `src/lib/utils/llmModels.js`

### LangChain version

The repo uses LangChain v1.x packages:

- `@langchain/core@^1.1.24`
- `@langchain/openai@^1.2.7`
- `@langchain/anthropic@^1.3.17`
- `@langchain/google-genai@^2.1.18`
- `@langchain/ollama@^1.2.2`

Migration from v0.3.x to v1.x was completed with smoke tests verifying provider connectivity.

## 2) How LLM Calls Are Used In App Features

### Configuration sources

- Credentials/endpoints are env-driven (for capability):
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `GOOGLE_API_KEY`
  - `OLLAMA_BASE_URL`
- Provider/model choices are admin settings (DB/site settings), surfaced to runtime in `locals.site`.

### Provider/model resolution

- `ai.js` resolves effective provider/model and dynamically loads the corresponding client.
- If the selected provider is missing credentials, invocation fails with provider-specific key error.
- Ollama image path is blocked (no image support in current flow).

### Feature entry points

#### Recipe parse/generation/translation

- `src/routes/api/recipe/parse/+server.js`
  - Uses `extractRecipeWithLLM` (text/html parse) or `generateRecipeWithLLM` (prompt-to-recipe).
- `src/routes/api/recipe/scrape/[url]/+server.js`
  - Structured scrape first; LLM fallback when standard extraction is incomplete.
- `src/routes/api/recipe/parse/image/+server.js`
  - Uses `extractRecipeWithLLM` with image content blocks.
- `src/routes/api/recipe/translate/+server.js`
  - Uses `translateRecipeWithLLM`.
- `src/routes/api/recipe/cleanup/+server.js`
  - Uses LLM generation path for cleanup/normalization tasks.

### Prompting and output contracts

- Prompts enforce JSON-only output with a shared recipe shape.
- `ai.js` includes output repair logic for common LLM formatting issues:
  - Markdown fences
  - trailing commas
  - partially truncated JSON (best-effort closure)

## 3) Embeddings In The Same Stack

Embeddings are implemented separately from chat models, in:

- `src/lib/utils/embeddings.js`

### Supported providers (embeddings)

- OpenAI
- Google
- Ollama

Provider/model metadata and defaults are centralized in:

- `src/lib/utils/llmModels.js`

### Embedding model resolution

- Source of truth for model selection: admin site settings (DB).
- If no model is set, use provider default from curated model list.
- Env variables are used for provider capability only (credentials/endpoint), not as embedding model override.

## 4) Embeddings Data Flow (Semantic Search)

### A) Indexing flow (recipe -> vector)

1. Recipe text is prepared (`prepareRecipeText`) from core recipe fields.
2. App requests an embedding vector via provider API (`getEmbedding`).
3. Vector is converted to `Float32Array` and serialized to bytes for DB storage.
4. Serialized bytes are saved on the recipe embedding field.

Indexing can happen:

- Incrementally after recipe create/update (non-blocking), and
- In admin-triggered batches (`/api/embeddings/generate`).

### B) Query flow (search text -> ranked results)

1. User enters search text (frontend).
2. Semantic endpoint embeds the query text only (not full recipe dataset).
3. Server loads candidate recipe vectors and computes cosine similarity.
4. Semantic scores are returned and blended with fuzzy/text relevance in feed ranking.

Key files:

- Query/search endpoint: `src/routes/api/recipe/search/+server.js`
- Similarity + serialization helpers: `src/lib/utils/embeddings.js`
- Semantic availability guards: `src/lib/server/semanticHelpers.js`
- Background regeneration: `src/lib/server/semanticEmbedding.js`

## 5) Failure and Degradation Behavior

- Missing/invalid provider config: semantic jobs and relevant actions are disabled or no-op where appropriate.
- Chat invocation errors are logged server-side and returned as API errors.
- Semantic search is additive; when unavailable, app falls back to normal fuzzy/text behavior.
- Provider errors like quota/rate-limit (e.g. Gemini 429) surface from provider SDK and are treated as invocation failures.

## 6) How We Test LLM Features

Testing strategy is split into low-cost deterministic tests and optional live checks.

### Test files

- `src/tests/ai.unit.test.js`: Unit tests for JSON parsing and provider resolution.
- `src/tests/llm.smoke.test.js`: Live connectivity tests (auto-skip unless explicitly enabled).
- `src/tests/semantic.test.js`: Embedding helper tests (similarity, serialization).
- `src/tests/fixtures/llm-providers.js`: Shared provider config for tests.
- `src/tests/fixtures/llm-output/*.json`: JSON parsing edge-case fixtures.

### Unit tests (`ai.unit.test.js`)

Tests `parseLLMJsonOutput` with fixtures covering:

- Clean JSON
- Markdown-fenced JSON
- Trailing commas
- Truncated arrays/objects
- Extra content around JSON

Tests provider resolution functions from `llmModels.js`:

- `getAvailableAiProviders`
- `resolveProviderSelection`
- `getDefaultModelsForProvider`
- `getTextModelsForProvider` / `getImageModelsForProvider`
- `getAvailableEmbeddingProviders`
- `resolveEmbeddingProvider` / `resolveEmbeddingModel`

All tests are data-driven from `providerMeta` - adding a new provider automatically generates tests.

### Smoke tests (`llm.smoke.test.js`)

Live connectivity tests that run only when explicitly enabled:

- Tests chat API for each configured provider
- Tests embedding API for providers with embedding support
- Uses tiny prompts (~20 tokens) with 15s timeout

```bash
# Local one-off run (uses your existing provider keys)
RUN_LLM_SMOKE=true pnpm -s vitest run src/tests/llm.smoke.test.js
```

Behavior:

- If `RUN_LLM_SMOKE` is not `true`, the file no-ops/skips live checks.
- If `RUN_LLM_SMOKE=true`, each provider test runs only when its corresponding env key/URL is present.
- No extra persistent `.env` key is required; use one-off shell env for this flag.

### Semantic tests (`semantic.test.js`)

Validates non-network embedding helpers:

- `cosineSimilarity` - vector math
- `serializeEmbedding` / `deserializeEmbedding` - storage format
- `prepareRecipeText` - text preparation
- `resolveSemanticAvailability` - availability guards

### Connection testing

Shared connection test function for both admin UI and tests:

- `src/lib/utils/llmConnection.js` - `testProviderConnection()`
- `src/routes/api/llm/test/+server.js` - API endpoint
- Admin UI "Test Connection" buttons in site settings

### Cost-control approach

- Default `pnpm test` has no external API dependency (smoke tests auto-skip)
- Smoke tests use minimal prompts (~20 tokens each)
- Live tests run only when explicitly enabled via `RUN_LLM_SMOKE=true`
- Typical run is a handful of requests (chat for configured providers, plus embedding checks where supported)
- CI can run smoke with GitHub Secrets (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, optional `OLLAMA_BASE_URL`)

## 7) Operator Notes

- Admin settings choose provider/model behavior for chat and embeddings.
- Env config provides provider capability only.
- Semantic search does not send your full recipe DB to embedding APIs at query time; it sends the query text.

For user-facing setup and cost guidance, see:

- `docs/manual/usage.md`
