# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
Vanilla Cookbook is a self-hosted recipe manager built with SvelteKit. It emphasizes keeping the user experience simple ("vanilla") while handling complex ingredient parsing, unit conversion, and multilingual support under the hood.

## Technology Stack
- **Framework**: SvelteKit with Node.js adapter
- **Database**: SQLite with Prisma ORM
- **Styling**: PicoCSS with custom SCSS
- **Testing**: Vitest with JSDOM
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **AI Integration**: Optional OpenAI/Anthropic support
- **PWA**: Service Worker with Workbox
- **Authentication**: Lucia v2 with OAuth (Google/GitHub)

## Project Structure
```
src/
├── lib/                    # Core business logic
│   ├── components/         # Reusable Svelte components
│   ├── utils/             # Utility modules
│   │   ├── parse/          # Recipe parsing & scraping
│   │   ├── image/          # Image processing
│   │   ├── import/         # Import from Paprika format
│   │   └── pwa/            # PWA configurations
│   └── submodules/         # Git submodules (recipe parser)
├── routes/                 # SvelteKit file-based routing
│   ├── api/               # REST API endpoints
│   └── user/[id]/         # User-specific routes
└── server/                 # Server-side code
```

## Database Schema
- **Recipe**: Core recipe data with relationships
- **Category**: Hierarchical category system
- **RecipePhoto**: Image support for recipes
- **RecipeLog**: Cooking history tracking
- **ShoppingListItem**: Ingredient shopping lists
- **AuthUser**: User management with Lucia auth
- **SiteSettings**: Global settings

## Key Commands

### Development
```bash
# Initial setup
pnpm dev:install     # Install dependencies and generate Prisma
pnpm dev              # Start dev server with auto-migration

# Production
pnpm build           # Build for production
pnpm serve           # Start production server
```

### Tests
```bash
pnpm test            # Run tests (needs dev server for API tests)
pnpm test:watch     # Run tests in watch mode
pnpm coverage        # Generate coverage report
```

### Code Quality
```bash
pnpm lint            # Run ESLint and Prettier checks
pnpm format          # Format code with Prettier
```

### Database
```bash
pnpm prisma generate    # Generate client
pnpm prisma migrate dev # Run migrations
pnpm prisma db seed   # Seed with sample data

# Reset database (from package.json)
pnpm prisma migrate reset --force
```

### Environment Setup
1. Copy `.env.template` to `.env`
2. Set `ORIGIN=http://localhost:5173` for dev
3. Configure `VITE_APP_ROOT_PATH` for imports
4. Optional: Add OpenAI/Anthropic API keys for AI features

### Documentation
```bash
pnpm docs:build      # Generate JSDocs and screenshots
```

## Core Features
- **Ingredient Parsing**: Multi-language support with units
- **Recipe Scaling**: Automatic scaling of ingredient quantities
- **Import/Export**: Paprika format support
- **Web Scraping**: Recipe extraction from URLs
- **AI Assistant**: OpenAI/Anthropic integration
- **PWA**: Mobile installation and offline support
- **User Management**: Multi-user with authorization
- **Shopping Lists**: Integrated ingredient lists
- **Cooking Logs**: Recipe cooking history

## Key Directories
- `src/lib/utils/parse/` - Recipe parsing and scraping
- `src/lib/utils/import/` - Paprika import functionality
- `src/lib/utils/image/` - Image processing and optimization
- `src/routes/api/` - RESTful API endpoints
- `static/` - PWA assets and service worker