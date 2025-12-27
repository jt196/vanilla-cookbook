# UI Migration Plan: PicoCSS → Component Library → Tailwind + DaisyUI

## Overview

This document outlines a phased approach to migrate Vanilla Cookbook from PicoCSS to a component-based architecture with Tailwind CSS + DaisyUI. The strategy focuses on creating ~10 core reusable components that will abstract 80%+ of the UI patterns, making the eventual framework migration seamless.

## Current State

**Styling Architecture:**
- **Framework**: PicoCSS (classless CSS framework)
- **Customization**: Extensive SCSS variable overrides in `/src/lib/css/`
- **Theme Support**: Dark/light themes via CSS variables (`--pico-*`)
- **Component Styles**: Scoped SCSS blocks in individual .svelte files
- **Existing Components**: 73 total (30+ SVG icons, domain-specific components, minimal UI primitives)

**Key Insight**: PicoCSS is classless, meaning we rely heavily on semantic HTML + CSS variables. Tailwind is utility-first, requiring explicit classes. A component abstraction layer will bridge this gap cleanly.

## Migration Goals

1. **Decouple UI from framework**: Abstract UI primitives into reusable Svelte components
2. **Incremental adoption**: Page-by-page migration without breaking existing functionality
3. **Maintain current UX**: No visual changes during component abstraction phase
4. **Prepare for Tailwind**: Component props designed to map cleanly to Tailwind utilities
5. **Keep it simple**: Target ~10 core components covering 80% of UI needs

## The 10 Core Components

### Priority 1: Foundation (Week 1)

#### 1. **Button** (`src/lib/components/ui/Button.svelte`)
**Current usage**: 50+ instances across codebase
- Primary, Secondary, Outline variants
- Icon buttons (no background)
- Loading states (`aria-busy`)
- Disabled states

**Props:**
```typescript
{
  variant: 'primary' | 'secondary' | 'outline' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  disabled: boolean
  loading: boolean
  type: 'button' | 'submit' | 'reset'
  class: string // Allow custom classes
  onclick: (e: Event) => void
}
```

**Files to migrate first:**
- `RecipeCard.svelte` (4 button instances)
- `RecipeViewButtons.svelte` (6 button instances)
- `ConfirmationDialog.svelte` (2 button instances)

---

#### 2. **Badge** (`src/lib/components/ui/Badge.svelte`)
**Current usage**: Recipe ingredient flags, admin backup types
- Type-based color variants
- Small rounded pill shape

**Props:**
```typescript
{
  variant: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size: 'sm' | 'md'
  class: string
}
```

**Files to migrate:**
- `RecipeViewIngs.svelte` (ingredient flags: ~, opt, srv, tt)
- `src/routes/user/[id]/(private)/options/admin/site/+page.svelte` (backup type badges)

---

#### 3. **Card** (`src/lib/components/ui/Card.svelte`)
**Current usage**: Recipe cards, user cards, content containers
- Border, padding, hover effects
- Optional clickable state

**Props:**
```typescript
{
  variant: 'elevated' | 'outline'
  hoverable: boolean
  clickable: boolean
  class: string
}
```

**Slots**: Default slot for content

**Files to migrate:**
- `RecipeCard.svelte` (article wrapper)
- `UserCard.svelte` (article wrapper)
- All form pages (container articles)

---

#### 4. **Input** (`src/lib/components/ui/Input.svelte`)
**Current usage**: Every form (login, register, recipe edit, settings)
- Text, password, email, number types
- Label integration
- Error state display

**Props:**
```typescript
{
  type: 'text' | 'password' | 'email' | 'number' | 'url'
  label: string
  value: string
  placeholder: string
  error: string
  required: boolean
  disabled: boolean
  class: string
}
```

**Files to migrate:**
- Login/register pages
- `RecipeForm.svelte`
- Admin settings pages

---

### Priority 2: Forms & Tables (Week 2)

#### 5. **Textarea** (`src/lib/components/ui/Textarea.svelte`)
**Props:**
```typescript
{
  label: string
  value: string
  rows: number
  placeholder: string
  error: string
  required: boolean
  class: string
}
```

**Files to migrate:**
- `RecipeForm.svelte` (ingredients, instructions)
- Shopping list notes

---

#### 6. **Checkbox** (`src/lib/components/ui/Checkbox.svelte`)
**Current usage**: Settings toggles, shopping list items
**Props:**
```typescript
{
  label: string
  checked: boolean
  disabled: boolean
  class: string
  onchange: (checked: boolean) => void
}
```

**Files to migrate:**
- Site settings (registration toggle)
- Shopping list (item checkboxes)
- Recipe form options

---

#### 7. **Table** (`src/lib/components/ui/Table/`)
**Structure**: Compound components
- `Table.svelte` (wrapper)
- `TableHead.svelte`
- `TableBody.svelte`
- `TableRow.svelte`
- `TableCell.svelte`

**Props (Table):**
```typescript
{
  striped: boolean
  hoverable: boolean
  class: string
}
```

**Files to migrate:**
- Admin backup table (`src/routes/user/[id]/(private)/options/admin/site/+page.svelte`)
- User management table

---

### Priority 3: Complex Components (Week 3)

#### 8. **Modal** (`src/lib/components/ui/Modal.svelte`)
**Current**: `ConfirmationDialog.svelte` exists but needs enhancement
**Props:**
```typescript
{
  open: boolean
  title: string
  size: 'sm' | 'md' | 'lg' | 'xl'
  onClose: () => void
  class: string
}
```

**Slots**: `title`, `default` (body), `footer`

**Files to migrate:**
- Enhance existing `ConfirmationDialog.svelte`
- Shopping list edit modal
- User admin edit modal

---

#### 9. **FormField** (`src/lib/components/ui/FormField.svelte`)
**Purpose**: Wrapper for label + input + validation message
**Props:**
```typescript
{
  label: string
  error: string
  required: boolean
  class: string
}
```

**Slots**: Default (for input component)

**Usage Pattern:**
```svelte
<FormField label="Email" error={errors.email} required>
  <Input type="email" bind:value={email} />
</FormField>
```

---

#### 10. **Container** (`src/lib/components/ui/Container.svelte`)
**Purpose**: Consistent max-width content wrapper
**Props:**
```typescript
{
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  class: string
}
```

**Current pattern**: `<div class="container">` throughout app

---

## Component Library Structure

```
src/lib/components/ui/
├── Button.svelte
├── Badge.svelte
├── Card.svelte
├── Container.svelte
├── Modal.svelte
├── Form/
│   ├── Input.svelte
│   ├── Textarea.svelte
│   ├── Checkbox.svelte
│   ├── Select.svelte
│   └── FormField.svelte
└── Table/
    ├── Table.svelte
    ├── TableHead.svelte
    ├── TableBody.svelte
    ├── TableRow.svelte
    └── TableCell.svelte
```

**Usage:**
```svelte
<script>
  import Button from '$lib/components/ui/Button.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import Input from '$lib/components/ui/Form/Input.svelte'
  import Table from '$lib/components/ui/Table/Table.svelte'
</script>
```

## Migration Phases

### Phase 0: Setup (1 day)
1. Create `src/lib/components/ui/` directory structure
2. Set up barrel export (`index.js`)
3. Document component API patterns in this file

### Phase 1: Component Abstraction (2-3 weeks)
**Goal**: Create all 10 components with PicoCSS styling intact

**Week 1 - Foundation:**
1. Build Button component (map current classes to variant props)
2. Build Badge component
3. Build Card component
4. Build Input component
5. Test on 2-3 pages (admin site settings, recipe card, login)

**Week 2 - Forms & Tables:**
6. Build Textarea component
7. Build Checkbox component
8. Build Table compound components
9. Build FormField wrapper
10. Migrate all form-heavy pages

**Week 3 - Complex & Polish:**
11. Enhance Modal component
12. Build Container component
13. Migrate remaining pages
14. Create component documentation/Storybook

**Success Criteria**:
- All pages use new components
- Zero visual changes
- All components accept `class` prop for escape hatch

### Phase 2: Tailwind Preparation (1 week)
**Goal**: Prepare components for Tailwind migration

1. Install Tailwind CSS + DaisyUI (but don't apply yet)
2. Configure Tailwind to coexist with PicoCSS temporarily
3. Add Tailwind classes to components alongside PicoCSS styles
4. Test dual styling (both frameworks active)

### Phase 3: Framework Swap (1-2 weeks)
**Goal**: Switch from PicoCSS to Tailwind + DaisyUI

1. Update each component to use Tailwind classes only
2. Remove PicoCSS variable references
3. Migrate theme system to DaisyUI themes
4. Remove PicoCSS from package.json
5. Delete `/src/lib/css/` SCSS files (except any custom utilities)

### Phase 4: Optimization (ongoing)
1. Remove unused Tailwind classes (PurgeCSS)
2. Add component variants as needed
3. Build additional components for new features

## Component Design Principles

### 1. **Accept `class` prop for customization**
```svelte
<script>
  let { class: className = '', variant = 'primary', ...props } = $props()
</script>

<button class="{baseClasses} {variantClasses[variant]} {className}" {...props}>
  {@render children()}
</button>
```

### 2. **Use Svelte 5 snippets for slots**
```svelte
<script>
  let { title, children } = $props()
</script>

<article>
  {#if title}
    <h3>{@render title()}</h3>
  {/if}
  <div>{@render children()}</div>
</article>
```

### 3. **Provide sensible defaults**
- Default variant should match current most-common usage
- Size defaults to 'md'
- Boolean props default to false

### 4. **Maintain accessibility**
- Preserve aria-* attributes
- Keep semantic HTML
- Don't break keyboard navigation

### 5. **Keep it simple**
- Avoid over-engineering
- If a component needs >10 props, split it
- Composition over configuration

## File Migration Checklist

### Completed Components (9 total)
- ✅ **Button.svelte** - With id, formaction, loading states, variant support
- ✅ **Badge.svelte** - Multiple variants (scheduled, pre-migration, manual, etc.)
- ✅ **Container.svelte** - Page wrapper component
- ✅ **Form/Checkbox.svelte** - Supports both label prop and children for rich content
- ✅ **Form/Radio.svelte** - Radio button inputs with group binding
- ✅ **Form/Input.svelte** - Text/password/email inputs with labels
- ✅ **Table/Table.svelte** - Table wrapper
- ✅ **Table/TableHead.svelte**, **Table/TableBody.svelte**, **Table/TableRow.svelte** - Table structure
- ✅ **Table/TableCell.svelte** - With tag (td/th) and scope attribute support

### High-Priority Pages (Settings)
- ✅ `/src/routes/user/[id]/(private)/options/admin/site/+page.svelte` - Admin settings + backup table
- ✅ `/src/routes/user/[id]/(private)/options/settings/+page.svelte` - User settings with checkboxes/radios
- ✅ `/src/routes/user/[id]/(private)/options/password/+page.svelte` - Password change form
- ✅ `/src/routes/user/[id]/(private)/options/admin/users/+page.svelte` - User management table + modal
- ✅ `/src/routes/user/[id]/(private)/options/bookmark/+page.svelte` - Just uses Bookmarklet component (no migration needed)
- [ ] `/src/routes/user/[id]/(private)/options/paprikaapi/+page.svelte` - Paprika import (complex, many buttons/inputs)
- [ ] `/src/routes/user/[id]/(private)/options/export/+page.svelte` - Export page
- [ ] `/src/routes/user/[id]/(private)/options/import/+page.svelte` - Import page

### Authentication Pages
- [ ] `/src/routes/login/+page.svelte`
- [ ] `/src/routes/register/+page.svelte`

### Recipe Components (Not Started)
- [ ] `src/lib/components/RecipeCard.svelte`
- [ ] `src/lib/components/RecipeViewButtons.svelte`
- [ ] All remaining `src/lib/components/Recipe*.svelte` files

### Medium-Priority Pages
- [ ] `/src/routes/recipe/(private)/[recipeId]/edit/+page.svelte`
- [ ] `/src/routes/user/[id]/(private)/shopping/+page.svelte`

### Low-Priority Pages
- [ ] Remaining recipe view components
- [ ] Photo sections
- [ ] Bookmarklet components

## Testing Strategy

### Visual Regression Testing
1. Before migration: Screenshot all key pages
2. After each component: Compare screenshots
3. Acceptance: Pixel-perfect match

### Functional Testing
1. Test all button click handlers still work
2. Test all form submissions
3. Test all modals open/close
4. Test theme switching

### Accessibility Testing
1. Keyboard navigation through forms
2. Screen reader announcements
3. Focus management in modals

## Rollback Plan

Each phase is isolated:
- **Phase 1**: If component abstraction fails, keep using semantic HTML
- **Phase 2**: If Tailwind setup fails, stay on PicoCSS components
- **Phase 3**: If Tailwind migration breaks styling, revert to Phase 2

Git branches:
- `main` - Production
- `ui/component-abstraction` - Phase 1
- `ui/tailwind-prep` - Phase 2
- `ui/tailwind-migration` - Phase 3

## Success Metrics

### Phase 1 Complete:
- ✅ All 10 core components built
- ✅ 90%+ of pages migrated to use components
- ✅ Zero visual regressions
- ✅ No accessibility regressions

### Phase 3 Complete:
- ✅ PicoCSS removed from dependencies
- ✅ All styling via Tailwind + DaisyUI
- ✅ Theme switching working
- ✅ Bundle size reduced or neutral
- ✅ Dark/light themes functioning

## Timeline Estimate

- **Phase 0 (Setup)**: 1 day
- **Phase 1 (Component Abstraction)**: 2-3 weeks
- **Phase 2 (Tailwind Prep)**: 1 week
- **Phase 3 (Framework Swap)**: 1-2 weeks
- **Phase 4 (Optimization)**: Ongoing

**Total**: ~5-7 weeks for complete migration

## Open Questions

1. **Theme strategy**: Map current PicoCSS dark/light themes to DaisyUI themes, or redesign?
2. **Component library**: Publish as separate package, or keep internal?
3. **Storybook**: Set up component documentation/playground?
4. **Design tokens**: Extract colors/spacing to design token system?

## Next Steps

1. Review this plan
2. Build first 3 components (Button, Badge, Card) as proof of concept
3. Test on admin site settings page
4. Iterate based on learnings
5. Proceed with full Phase 1 migration

---

**Last Updated**: December 2024
**Status**: Planning Phase
**Owner**: Project Maintainer
