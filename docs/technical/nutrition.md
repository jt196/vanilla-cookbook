# Nutrition

## Overview

Vanilla Cookbook stores nutrition as raw text in `Recipe.nutritional_info`.

At runtime, the app parses this text into a structured object for display and scaling behavior. No schema migration is required in v1.

## Data Flow

1. Nutrition text is imported/scraped into `Recipe.nutritional_info`.
2. Recipe view calls `parseNutritionInfo(text, language)`.
3. Parsed entries render in `RecipeViewNutrition.svelte` using shared table components.
4. If parser confidence is low, the raw text block is rendered as a safe fallback.
5. When AI cleanup is used, `/api/recipe/cleanup` with `type: "nutrition"` returns normalized nutrition.
6. Normalized text is serialized back into `Recipe.nutritional_info`.

## Parsing and Display

Core parser utilities are in `src/lib/utils/nutrition.js`:

- `parseNutritionInfo(text, language = 'eng')`
- `scaleNutrition(parsed, scale)`

Localization dictionaries are in `src/lib/utils/nutritionI18n.js` and provide:

- `nutrientAliases`
- `perServingPhrases`
- `ignoreTokens`

Parser behavior is language-first with fallback to English lexicons.

## Parsed Structure

```js
{
  perServing: true,
  format: 'line' | 'pipe' | 'sentence' | 'nutrition_facts' | 'unknown',
  confidence: 0.0,
  rawText: '...',
  entries: [
    {
      name: 'Calories',
      canonicalName: 'calories',
      quantity: 471,
      unit: 'kcal',
      raw: 'Calories: 471 kcal',
      note: ''
    }
  ]
}
```

Notes:

- `note` is optional metadata extracted from row text when present.
- Scaling is applied only when `perServing === false`.
- `perServing === true` values are intentionally not scaled.

## Cleanup Serialization

Cleanup route: `src/routes/api/recipe/cleanup/+server.js` (`type: "nutrition"`).

Normalized text output uses a predictable newline format:

1. Optional localized per-serving prefix (first locale phrase).
2. Two newline characters.
3. One nutrient per line in `Name: quantity unit` form.

This format keeps human readability while improving parser consistency.

## UI Integration

- Recipe view component: `src/lib/components/recipe/RecipeViewNutrition.svelte`
- Recipe edit form: `src/lib/components/recipe/RecipeForm.svelte`

View behavior:

- Renders a strict 2-column table (`Nutrient`, `Amount`).
- Shows `Per serving` or `Per recipe (scaled)` status.
- Falls back to raw text when parse confidence is low.

## Discovery and Coverage

Data discovery tooling:

- Audit script: `scripts/nutrition/audit-nutrition.mjs`
- Fixture export: `scripts/nutrition/export-fixture.mjs`

Current fixture-based benchmark uses local sample records from the app database and is validated in:

- `src/tests/nutrition.coverage.test.js`

Coverage target for parsed rows is `>= 80%` for the sample fixture.

## Research Notes (Future)

Future research may estimate nutrition directly from parsed ingredients using ingredient-density and nutrient datasets.

This is roadmap-only in the current phase and not implemented.
