# AI Assistant Guide for Vanilla Cookbook

Comprehensive guidance for AI/code assistants working on Vanilla Cookbook, a self-hosted SvelteKit recipe manager with advanced parsing, unit conversion, and PWA capabilities.

## Project Philosophy

Vanilla Cookbook prioritizes **simplicity in user experience** while handling **complexity under the hood**. The core principle: let users work with unstructured text (recipes as they exist on the web) while automatically providing structure, conversion, and scaling capabilities. Avoid over-engineering the UI or forcing users into rigid data entry patterns.

## Tech Stack Overview

- **Framework**: SvelteKit (Svelte 5) with Vite
- **Database**: Prisma ORM with SQLite (default), supports migrations
- **Styling**: PicoCSS (semantic, minimal CSS framework)
- **Authentication**: Lucia v2 with Prisma adapter
- **Testing**: Vitest with jsdom, @testing-library/svelte
- **PWA**: Workbox for service worker generation
- **AI Integration**: Optional OpenAI/Anthropic API for parsing assistance
- **Recipe Parsing**: Custom ingredient parser (git submodule at `src/lib/submodules/recipe-ingredient-parser`)
- **Package Manager**: pnpm (engine-strict, required)

## Project Structure

```
vanilla-cookbook/
├── src/
│   ├── lib/
│   │   ├── components/        # Svelte UI components (39 files)
│   │   ├── utils/             # Core business logic
│   │   │   ├── parse/         # Recipe scraping & parsing (HTML, JSON-LD, microdata)
│   │   │   ├── import/        # Import formats (Paprika, JSON, CSV)
│   │   │   ├── image/         # Image processing with Sharp
│   │   │   ├── pwa/           # Service worker generation
│   │   │   ├── seed/          # Database seeding utilities
│   │   │   ├── prisma/        # Prisma helpers
│   │   │   ├── ai.js          # LLM integration (OpenAI/Anthropic)
│   │   │   ├── converter.js   # Unit conversion (US/metric/imperial)
│   │   │   ├── crud.js        # Database operations
│   │   │   ├── filters.js     # Search & filtering logic
│   │   │   └── ...            # Other utilities
│   │   ├── submodules/
│   │   │   └── recipe-ingredient-parser/  # Git submodule for parsing
│   │   ├── server/            # Server-side utilities (auth, hooks)
│   │   ├── stores/            # Svelte stores
│   │   ├── data/              # Static data (ingredient densities, etc.)
│   │   ├── css/               # Global styles
│   │   └── typeDefinitions.js # JSDoc type definitions
│   └── routes/                # SvelteKit routes
│       ├── api/               # API endpoints
│       │   ├── recipe/        # Recipe CRUD, scraping, image ops
│       │   ├── user/          # User management
│       │   ├── ingredients/   # Ingredient data
│       │   ├── log/           # Cooking logs
│       │   ├── site/          # Site settings
│       │   ├── oauth/         # OAuth providers
│       │   └── health/        # Health check
│       ├── user/[id]/         # User-specific pages
│       ├── recipe/            # Recipe pages
│       ├── login/             # Auth pages
│       ├── register/
│       └── ...
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration history
│   └── db/                    # SQLite database file
├── static/                    # PWA assets, icons, manifest
├── docs/                      # Documentation
│   ├── manual/                # User manual
│   ├── technical/             # Technical docs (auto-generated JSDoc)
│   ├── scripts/               # Python scripts for docs/screenshots
│   └── images/                # Screenshots
├── build/                     # Production build output (gitignored)
├── site/                      # Generated docs site (gitignored)
└── uploads/                   # User-uploaded images (persistent)
```

## Key Features & Implementation Areas

### 1. Recipe Parsing & Scraping
**Location**: `src/lib/utils/parse/`, `src/routes/api/recipe/scrape/`

- **JSON-LD parsing**: Primary method, extracts schema.org Recipe data from `<script type="application/ld+json">`
- **Microdata fallback**: Extracts schema.org microdata from HTML attributes (`itemprop`, `itemscope`)
- **Site-specific configs**: Custom CSS selectors for sites without structured data
- **AI assist**: Falls back to OpenAI/Anthropic when structured parsing fails
- **Bookmarklet**: Browser bookmarklet for easy recipe capture from any site

**Key files**:
- `recipeParse.js`: Main parsing orchestrator (`parseURL`, `parseHTML`)
- `parseHelpers.js`: Extraction utilities (JSON-LD, microdata, nutrition, images)
- `parseHelpersClient.js`: Client-side parsing (`scrapeRecipeFromURL`, `handleParse`, `handleImage`)

### 2. Ingredient Parsing & Conversion
**Location**: `src/lib/submodules/recipe-ingredient-parser/` (submodule), `src/lib/utils/converter.js`

- **Multi-language parsing**: Supports 10+ languages (English, German, Italian, Spanish, French, Portuguese, Indonesian, Hindi, Russian, Arabic)
- **Smart unit conversion**: US volumetric → metric/imperial weight using ingredient-specific densities
- **Ingredient database**: Thousands of ingredients with gram-per-cup densities (`src/lib/data/`)
- **Inline conversion**: Temperature, fractions, ranges handled automatically
- **Recipe scaling**: Multiplies all parsed quantities while preserving units

**Important**: The ingredient parser is a **git submodule**. Changes to parsing logic belong in the submodule repo, not here.

### 3. User Authentication & Privacy
**Location**: `src/lib/server/`, `src/routes/api/user/`, Prisma schema

- **Lucia v2**: Session-based auth with Prisma adapter
- **Multi-user support**: User creation, admin/root roles, registration toggle
- **Public/private recipes**: Per-user and per-recipe privacy settings
- **OAuth support**: Google, GitHub providers (optional)
- **Rate limiting**: Login attempts limited by IP and user ID

**Prisma models**: `AuthUser`, `AuthSession`, `AuthKey`, `AuthAccount`, `SiteSettings`

### 4. PWA & Offline Support
**Location**: `src/lib/utils/pwa/`, `static/`

- **Service worker**: Auto-generated with Workbox (`generate-sw.js`)
- **Installable**: Web app manifest for mobile/desktop installation
- **Share target**: Receive URLs and text from other apps (mobile)
- **Offline caching**: Recipes and assets cached for offline access
- **Domain switching**: `./sw-domain.sh` updates service worker scope when `ORIGIN` changes

**Key commands**: `pnpm generate-sw`, `./sw-domain.sh`

### 5. Shopping List & Cooking Logs
**Location**: `src/routes/api/log/`, Prisma models

- **Shopping list**: Add ingredients from recipes, persist checked items, show/hide purchased
- **Cooking logs**: Track when recipes are cooked, calendar view, recipe-specific history
- **Database**: `ShoppingListItem`, `RecipeLog` models

### 6. Categories & Organization
**Location**: `src/lib/utils/categories.js`, Prisma `Category` model

- **Hierarchical categories**: Parent-child relationships, unlimited nesting
- **User-specific**: Each user has their own category tree
- **Optional feature**: Power user feature (hidden by default, `useCats` flag)

### 7. Image Handling
**Location**: `src/lib/utils/image/`, `src/routes/api/recipe/image/`

- **Sharp processing**: Resize, compress, convert images
- **Multiple photos**: `RecipePhoto` model supports multiple images per recipe
- **Upload persistence**: Images stored in `uploads/` directory
- **Remote scraping**: Download images from recipe URLs

## Development Workflow

### Initial Setup
```bash
# Clone with submodule
git clone --recursive https://github.com/jt196/vanilla-cookbook.git

# If already cloned, pull submodules
git submodule update --init --recursive

# Copy environment template
cp .env.template .env

# Edit .env - CRITICAL: Set ORIGIN=http://localhost:5173 for dev
# Optional: Add OPENAI_API_KEY or ANTHROPIC_API_KEY for AI assist

# Install dependencies and generate Prisma client
pnpm dev:install

# Run dev server (migrates DB, seeds data, starts Vite)
pnpm dev
```

### Common Commands
```bash
# Development
pnpm dev                  # Migrate, seed, start dev server
pnpm dev:setup            # Pre-run: generate SW, migrate, update SW domain
pnpm dev:install          # Install deps + Prisma generate

# Testing
pnpm test                 # Run Vitest tests
pnpm test:watch           # Watch mode
pnpm coverage             # Coverage report

# Linting & Formatting
pnpm lint                 # Prettier check + ESLint
pnpm format               # Format all files

# Database
pnpm prisma generate      # Regenerate Prisma client after schema changes
pnpm prisma migrate dev   # Create new migration (dev only)
pnpm seed                 # Seed sample data

# PWA
pnpm generate-sw          # Rebuild service worker
./sw-domain.sh            # Update SW scope (run after ORIGIN change)

# Documentation
pnpm docs:build           # Generate JSDoc + screenshots (requires Python setup)
pnpm docs:jsdocs          # Generate JSDoc only
pnpm docs:screen          # Generate screenshots only

# Production
pnpm build                # Prisma generate + SW + Vite build
pnpm serve                # Migrate deploy + seed + start Node server
pnpm start                # Build then serve
```

### Environment Variables (.env)
**Required**:
- `ORIGIN`: Full URL where app is hosted (critical for CORS, auth cookies)
  - Dev: `http://localhost:5173`
  - Docker: `http://localhost:3000` (default)
  - Production: Your actual domain

**Optional**:
- `OPENAI_API_KEY`: For AI-assisted parsing
- `ANTHROPIC_API_KEY`: Alternative to OpenAI
- `LLM_API_ENABLED`: Enable/disable AI features (default: true if key provided)
- `LLM_API_ENGINE_TEXT`: OpenAI model for text parsing (default: gpt-3.5-turbo)
- `LLM_API_ENGINE_IMAGE`: OpenAI model for image parsing (default: gpt-4o)
- `VITE_APP_ROOT_PATH`: Absolute path for Paprika import (rarely needed)
- `BODY_SIZE_LIMIT`: Max upload size in bytes (default: 5242880 = 5MB)
- `REGISTRATION_ALLOWED`: Allow new user registration (default: true)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: OAuth
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: OAuth

## Database Schema (Prisma)

### Core Models
- **`Recipe`**: Main recipe data (name, ingredients, directions, times, etc.)
  - Relations: `AuthUser`, `RecipeCategory[]`, `RecipePhoto[]`, `RecipeLog[]`, `ShoppingListItem[]`
  - Key fields: `uid` (PK), `userId` (FK), `is_public`, `is_pinned`, `in_trash`, `on_favorites`

- **`RecipePhoto`**: Multiple photos per recipe
  - Relations: `Recipe`
  - Fields: `id` (PK), `recipeUid` (FK), `url`, `fileType`, `isMain`, `notes`

- **`RecipeLog`**: Cooking history
  - Relations: `Recipe`, `AuthUser`
  - Fields: `id` (PK), `recipeUid` (FK), `userId` (FK), `cooked`, `cookedEnd`

- **`Category`**: Hierarchical categories
  - Self-relation: `parent` (one), `children` (many)
  - Relations: `AuthUser`, `RecipeCategory[]`
  - Fields: `uid` (PK), `userId` (FK), `parent_uid` (FK nullable), `name`, `order_flag`

- **`RecipeCategory`**: Many-to-many join table
  - Composite PK: `[recipeUid, categoryUid]`

- **`ShoppingListItem`**: Shopping list entries
  - Relations: `AuthUser`, `Recipe` (nullable)
  - Fields: `uid` (PK), `userId` (FK), `recipeUid` (FK nullable), `name`, `quantity`, `unit`, `purchased`

- **`AuthUser`**: User accounts & preferences
  - Relations: All recipe/log/category/shopping data
  - Key fields: `id` (PK), `username` (unique), `email` (unique), `units` (metric/us), `language`, `theme`, `isAdmin`, `isRoot`, `publicProfile`, `publicRecipes`
  - Preference flags: `skipSmallUnits`, `ingSymbol`, `ingMatch`, `ingOriginal`, `ingExtra`, `useCats`

- **`Ingredient`**: Ingredient density database
  - Fields: `id` (PK), `name` (unique), `gramsPerCup`

- **`SiteSettings`**: Global settings
  - Fields: `version`, `registrationAllowed`

### Auth Models (Lucia)
- **`AuthSession`**: User sessions
- **`AuthKey`**: Password hashes
- **`AuthAccount`**: OAuth accounts

## Testing

### Test Structure
- **Location**: `src/lib/utils/parse/recipeParse.test.js` (main parsing tests)
- **Framework**: Vitest + jsdom + @testing-library/svelte
- **Mocking**: `parseTesting.js` provides `mockFetchForURL` to test parsing without network requests
- **Test data**: Saved HTML files in `src/lib/data/recipe_html/`

### Running Tests
```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm coverage          # Coverage report
```

### Adding Parsing Tests
1. Add test URL to `downloadRecipes.js` sites array
2. Run script to download HTML: `node src/lib/utils/parse/downloadRecipes.js`
3. Add test case to `recipeParse.test.js`
4. Verify parsing extracts all expected fields

## Code Style & Conventions

### General
- **No TypeScript**: Project uses JavaScript with JSDoc types (see `typeDefinitions.js`)
- **Formatting**: Prettier enforced, 2-space indents, trailing commas
- **Linting**: ESLint with svelte, jsdoc plugins
- **JSDoc**: Document all utility functions (see `docs/technical/*.md` for examples)

### Svelte Conventions
- **Svelte 5 syntax**: Use runes (`$state`, `$derived`, `$effect`) for reactivity
- **Component naming**: PascalCase for components, kebab-case for files (e.g., `RecipeCard.svelte`)
- **Props**: Destructure props in component `<script>` tag
- **Stores**: Use Svelte stores for global state (see `src/lib/stores/`)

### API Routes
- **Structure**: `src/routes/api/[resource]/[action]/+server.js`
- **Methods**: Export `GET`, `POST`, `PUT`, `DELETE`, `PATCH` as needed
- **Responses**: Return `json()` from `@sveltejs/kit`, use HTTP status codes
- **Error handling**: Try-catch, return `{ error: 'message' }` with 400/500 status

### Database Operations
- **CRUD utilities**: Use functions from `src/lib/utils/crud.js` where possible
- **Transactions**: Use Prisma transactions for multi-step operations
- **Cascades**: Set up in schema (e.g., deleting user cascades to recipes/logs)
- **Migrations**: Never edit existing migrations, create new ones with `pnpm prisma migrate dev`

## Common Gotchas & Important Notes

### Submodule Management
- **Ingredient parser is a submodule**: Changes to parsing logic belong in the submodule repo
- **Sync carefully**: `git submodule update --init --recursive` after pulling
- **Commit separately**: Submodule commits are independent

### PWA & Service Worker
- **Regenerate after changes**: Run `pnpm generate-sw` if static assets change
- **Domain changes**: Run `./sw-domain.sh` after changing `ORIGIN` in `.env`
- **Cache invalidation**: SW version bumps automatically on rebuild

### Environment & CORS
- **ORIGIN is critical**: If `ORIGIN` doesn't match actual URL, auth cookies will fail
- **Docker vs local**: Different default ports (3000 vs 5173)
- **HTTPS in production**: Required for PWA features and secure cookies

### Database
- **SQLite by default**: Single file at `prisma/db/dev.sqlite`
- **Migrations in version control**: All migrations committed to repo
- **Seed data**: Sample recipes/users created on first run, idempotent
- **File uploads**: `uploads/` directory must persist (not gitignored)

### Image Processing
- **Sharp dependency**: Native module, may need rebuild on platform changes
- **Upload size limit**: Default 5MB (`BODY_SIZE_LIMIT`)
- **Multiple formats**: Supports JPEG, PNG, WebP, AVIF

### AI Features
- **Optional, not required**: All features work without API keys
- **Fallback gracefully**: If AI parsing fails, return error to user
- **Cost awareness**: Image parsing uses GPT-4o (more expensive)

## Documentation Generation

### Prerequisites
```bash
# Create Python virtual environment
virtualenv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows

# Install dependencies
pip install -r docs/scripts/docs-requirements.txt
```

### Running
```bash
# Ensure dev server is running
pnpm dev

# In separate terminal
pnpm docs:build  # Generates JSDoc + screenshots
```

### Output
- **JSDoc**: `docs/technical/*.md` (auto-generated from code comments)
- **Screenshots**: `docs/images/*.png` (captured from running dev server)
- **Configuration**: `docs/scripts/generate_jsdocs.py`, `docs/scripts/screenshots.py`

## Architecture Patterns

### Frontend State Management
1. **URL state**: Search params, filters, pagination
2. **Svelte stores**: Global UI state (theme, user preferences)
3. **Component state**: Local UI state (`$state` runes)
4. **Server data**: Loaded via `+page.server.js`, passed as props

### Backend Data Flow
1. **SvelteKit load functions**: Fetch data server-side, return to page
2. **API routes**: Handle mutations, called from client via `fetch`
3. **Prisma**: Single source of truth, migrations versioned
4. **CRUD utilities**: Reusable functions for common operations

### Parsing Pipeline
1. **Scrape**: Download HTML from URL
2. **Extract**: JSON-LD → Microdata → Site config → AI fallback
3. **Parse ingredients**: Use submodule parser
4. **Convert units**: Apply user's unit preference
5. **Save**: Store in database with user ID

### Image Pipeline
1. **Upload/scrape**: Receive file or download from URL
2. **Validate**: Check file type, size
3. **Process**: Resize, compress with Sharp
4. **Store**: Save to `uploads/` with unique filename
5. **Reference**: Store URL in `RecipePhoto` model

## Key Algorithms & Business Logic

### Unit Conversion (`converter.js`)
- **Ingredient lookup**: Match ingredient text to density database
- **Volume to weight**: Multiply volume (cups) by grams-per-cup
- **Temperature**: Celsius ↔ Fahrenheit inline conversion
- **Fractions**: Parse "1/2", "1 1/2" to decimals, convert, re-format
- **Ranges**: Handle "2-3 cups" (convert both values)

### Recipe Scaling
- **Parse quantities**: Extract numbers from ingredient lines
- **Multiply**: Apply scale factor (1.5x, 2x, etc.)
- **Preserve formatting**: Maintain fractions, ranges after scaling

### Search & Filtering (`filters.js`)
- **Fuse.js**: Fuzzy search on recipe names, ingredients, descriptions
- **Category filter**: Hierarchical category matching
- **Time filter**: Parse ISO durations, filter by prep/cook time
- **Favorites/pinned**: Boolean flags, sort to top

### Ingredient Parsing (Submodule)
- **Tokenization**: Split ingredient line into quantity, unit, ingredient, preparation
- **Unit normalization**: "cup" = "cups" = "c"
- **Language detection**: Auto-detect or user-specified
- **Multi-language support**: Different tokenization rules per language

## Roadmap & Future Features

See `docs/roadmap.md` for detailed feature wishlist. Key themes:
- **Enhanced text parsing**: Detect quantities in directions for scaling
- **Backup/restore**: Automated database backups
- **Browser extensions**: Native extensions for Chrome/Firefox
- **Advanced filtering**: Ingredient-based search, smarter categorization
- **Stats & analytics**: Top categories, most-cooked recipes

## Common Tasks for AI Assistants

### Adding a New API Endpoint
1. Create `src/routes/api/[resource]/[action]/+server.js`
2. Export HTTP method functions (`GET`, `POST`, etc.)
3. Import Prisma client, CRUD utilities
4. Validate input, handle errors, return JSON
5. Add JSDoc comments for documentation
6. Test with Vitest or manual API calls

### Adding a New Svelte Component
1. Create `src/lib/components/[ComponentName].svelte`
2. Use Svelte 5 runes for reactivity (`$state`, `$derived`)
3. Follow PicoCSS semantic HTML (minimal custom styles)
4. Document props with JSDoc comments
5. Import and use in relevant pages

### Modifying Database Schema
1. Edit `prisma/schema.prisma`
2. Run `pnpm prisma migrate dev --name [description]`
3. Commit migration files in `prisma/migrations/`
4. Update seed data if needed (`src/lib/utils/seed/seed.js`)
5. Regenerate Prisma client: `pnpm prisma generate`

### Adding a New Recipe Source
1. Test URL against current parser: `parseURL(url)`
2. If fails, check for JSON-LD, microdata, or add site config
3. Add test case to `recipeParse.test.js`
4. Download HTML for offline testing: `downloadRecipes.js`
5. Iterate on `parseHelpers.js` or site configs

### Improving Unit Conversion
1. Add ingredients to density database (`src/lib/data/`)
2. Update `converter.js` matching logic
3. Test with sample recipes containing new ingredients
4. Consider edge cases (fractions, ranges, multiple units)

## Support & Resources

- **Documentation**: https://vanilla-cookbook.readthedocs.io/
- **GitHub**: https://github.com/jt196/vanilla-cookbook
- **Issues**: https://github.com/jt196/vanilla-cookbook/issues
- **Docker Hub**: jt196/vanilla-cookbook (`:latest`, `:stable` tags)

## Final Notes for AI Assistants

- **Respect the aesthetic**: Keep UI simple, don't over-engineer
- **Test parsing changes**: Recipe parsing is complex, test thoroughly
- **Preserve backwards compatibility**: Many users have existing databases
- **Document changes**: JSDoc comments + manual docs where appropriate
- **Consider mobile**: PWA features, responsive design critical
- **Security**: Validate user input, sanitize HTML, prevent injection
- **Performance**: Optimize queries, lazy load images, paginate lists
- **Accessibility**: Semantic HTML, keyboard navigation, screen reader support

When in doubt, check existing patterns in the codebase. The project favors consistency over novelty.
