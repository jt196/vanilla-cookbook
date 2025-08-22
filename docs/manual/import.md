# Importing Recipes

Your cookbook can now import from several apps, using a single, simple flow:

1. Go to **Settings → Import**
2. Pick a **source** from the dropdown
3. Choose a **file** (ZIP/CSV as required)
4. (Optional) tick **Make recipes public**
5. Click **Import**

> Max upload size follows `BODY_SIZE_LIMIT` in your `.env`. Increase it if large archives fail.

## Other supported formats

These match the code in `src/lib/utils/import/registry.js` and follow the same “pick type → upload → import” flow.

| Source | File(s) you upload | What the ZIP/CSV must contain | Notes |
| --- | --- | --- | --- |
| **Paprika** | `.paprikarecipes` or `.zip` | A `.paprikarecipes` file, or a ZIP with `*.paprikarecipe` members | Categories ignored; photos imported if present |
| **Chowdown** | `.zip` | `_recipes/*.md` and optional `images/*` | Front-matter + body parsed; local images imported |
| **Mealie** | `.zip` | `recipes/<dir>/*.json` and `recipes/<dir>/images/*` | Ingredients/steps normalized; images imported from archive |
| **MyRecipeBox** | `.csv` | Columns like `title, description, ingredients, instructions, notes, …` | Maps columns directly to your schema; no images |
| **Nextcloud** | `.zip` | `<dir>/recipe.json` and `<dir>/full.jpg` (use `full.jpg`) | JSON is schema.org-ish; image imported |
| **PlanToEat** | `.csv` | Official PTE export CSV | Downloads `Photo Url` if present |
| **Recipe Keeper** | `.zip` | `recipes.html` and `images/<uid>_*.jpg` | HTML parsed; photos matched by filename |
| **Tandoor** | `.zip` | Top-level numbered zips each with `recipe.json` and `image` (with or without extension) | Uses embedded image; images without extension are handled |

## What gets mapped where?

All importers use the same map-driven pipeline. Fields are normalized into your `Recipe` schema:

- `name`, `description`, `ingredients`, `directions`, `notes`
- `prep_time`, `cook_time`, `total_time`
- `servings`
- `rating`
- `source` and `source_url`
- `image_url`/`photo_url` (if present)
- `created` (converted to a Date when available)
- Flags: `on_favorites`, `on_grocery_list`, `is_pinned`, `in_trash` (defaults to false)
- `is_public` (from the checkbox)

Photos are imported when available:

- **From archives** (Paprika, Mealie, Nextcloud, Recipe Keeper, Tandoor): saved locally and attached to each recipe.
- **From CSVs** (PlanToEat): we try to download the `Photo Url`.

Categories/tags are ignored for now across all importers.
