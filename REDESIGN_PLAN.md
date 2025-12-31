# Vanilla Cookbook: PicoCSS to DaisyUI/Tailwind Migration Plan

**Branch:** `redesign`
**Date:** 2025-12-30
**Status:** Planning Phase

---

## Executive Summary

Migration from PicoCSS semantic CSS framework to DaisyUI (Tailwind-based component library) to gain:
- More modern component ecosystem
- Better customization flexibility
- Utility-first CSS approach
- Active community and plugin support
- Maintained design system

**Estimated Scope:** ~95 files to update (39 components + 56 routes/pages)

---

## Current Design Analysis

### Color Palette (Mapping to DaisyUI)

#### Current Design Colors → DaisyUI Theme Colors

**Primary (Cyan/Teal):**
- Current: `#1095c1` / `hsl(195, 85%, 41%)`
- **DaisyUI:** `primary` (will use sky-blue `#0ea5e9` or similar cyan)
- Hover states: `primary-focus`
- Text on primary: `primary-content`

**Backgrounds:**
- Dark background: `base-100` (DaisyUI dark theme default: `#1d232a`)
- Card background: `base-200` (DaisyUI dark theme default: `#191e24`)
- Card sections: `base-300` (DaisyUI dark theme default: `#15191e`)
- Light background: `base-100` (DaisyUI light theme default: `#ffffff`)

**Text Colors:**
- Primary text: `base-content` (auto-calculated for contrast)
- Muted text: `base-content/70` (opacity)
- Headers: `base-content` with appropriate heading classes

**UI Elements:**
- Secondary buttons: `secondary`, `secondary-content`
- Borders: `base-300` or `neutral`
- Success states: `success`, `success-content`
- Error states: `error`, `error-content`
- Info messages: `info`, `info-content`
- Warnings: `warning`, `warning-content`

**Strategy:** Use DaisyUI's standard "dark" and "light" themes with only the primary color customized to cyan/sky-blue. This gives us all the auto-calculated contrast colors and works perfectly with all DaisyUI components.

### Typography
- **Font:** Inter (system fallback)
- **Font Size:** 87.5% base (reduced from Pico's 100%)
- **Line Height:** 1.25 (reduced from Pico's 1.5)
- **Font Weight:** Headings at 600 (reduced from 700)

### Layout
- **Container Max Width:**
  - Mobile: 576px min
  - Tablet: 748px
  - Desktop: 1004px
- **Border Radius:** 0.375rem (6px)
- **Card Border Radius:** 0.75rem (12px, 2x base)
- **Form Spacing Vertical:** 0.5rem
- **Form Spacing Horizontal:** 1rem

### Key UI Patterns

#### Navigation
- Horizontal nav bar with logo (left) and icon buttons (right)
- Icon-based navigation: Theme, Users, Add, Shopping, Calendar, Settings
- Logo: Cookbook icon + "Vanilla" wordmark

#### Cards
- Article/card elements with border
- Star ratings (5-star system)
- Favorite/checkbox icons
- Recipe images (rounded thumbnails)
- Hover states on interactive elements

#### Buttons
- Primary: Filled cyan background
- Secondary/Outline: Border with transparent background
- Icon buttons: Just icons, no background (until hover)
- Sorting buttons: Date, Title, Rating with sort direction indicators

#### Forms
- Text inputs with subtle borders
- Search bar with placeholder
- Dropdowns/selects
- Checkboxes and radio buttons
- File upload inputs
- Textareas

#### Lists
- Recipe cards with title, rating, icons
- Shopping list items with checkboxes
- User lists with action buttons
- Category trees (hierarchical)

#### Modals/Dialogs
- Confirmation dialogs
- Edit dialogs (shopping items)
- Dark overlay background

#### Calendar
- Full calendar view for cooking logs
- Day/month views

---

## Migration Strategy

### Phase 1: Setup & Configuration

#### 1.1 Install Dependencies
```bash
pnpm add -D tailwindcss postcss autoprefixer daisyui
pnpm add -D @tailwindcss/typography @tailwindcss/forms
npx tailwindcss init -p
```

#### 1.2 Configure Tailwind
**File:** `tailwind.config.js`
```js
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: '0.875rem', // 87.5% of 16px = 14px
      },
      lineHeight: {
        normal: '1.25',
      },
      maxWidth: {
        'container-sm': '576px',
        'container-md': '748px',
        'container-lg': '1004px',
      }
    },
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          "primary": "#0ea5e9", // Sky blue (close to current cyan)
          "primary-content": "#ffffff",
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          "primary": "#0ea5e9", // Sky blue (close to current cyan)
          "primary-content": "#ffffff",
        },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
  },
}
```

**Alternative:** Use DaisyUI's built-in "aqua" theme which already has cyan colors, or pick from:
- **"cyberpunk"** - Neon cyan/yellow (fun but maybe too bold)
- **"dark"** - Standard dark with blue primary
- **"light"** - Standard light with blue primary
- **"nord"** - Cool blue-gray palette
- **"business"** - Professional blue tones

See all themes: https://daisyui.com/docs/themes/

#### 1.3 Update Global Styles
**File:** `src/app.css` (new file)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    font-family: Inter, system-ui, sans-serif;
    font-size: 87.5%;
    line-height: 1.25;
  }
}
```

#### 1.4 Update Layout Import
**File:** `src/routes/+layout.svelte`
- Replace `import '@picocss/pico'` with `import '../app.css'`
- Update theme toggling to work with DaisyUI's data-theme

#### 1.5 Remove PicoCSS
```bash
pnpm remove @picocss/pico
rm -rf src/lib/css/
```

---

### Phase 2: Core Component Migration

Migrate in order of dependency (lowest level first).

#### 2.1 UI Primitives (Week 1)

**Priority Order:**
1. **Button** (`src/lib/components/ui/Button.svelte`)
   - DaisyUI: `btn`, `btn-primary`, `btn-secondary`, `btn-outline`, `btn-ghost`
   - Sizes: `btn-sm`, `btn-md`, `btn-lg`

2. **IconButton** (`src/lib/components/ui/IconButton.svelte`)
   - DaisyUI: `btn btn-circle btn-ghost`

3. **Badge** (`src/lib/components/ui/Badge.svelte`)
   - DaisyUI: `badge`, `badge-primary`, `badge-outline`

4. **Container** (`src/lib/components/ui/Container.svelte`)
   - Tailwind: `max-w-container-md mx-auto px-4`

5. **Hint** (`src/lib/components/ui/Hint.svelte`)
   - DaisyUI: `tooltip` or custom with `text-sm text-gray-500`

#### 2.2 Form Components (Week 1-2)

6. **Input** (`src/lib/components/ui/Form/Input.svelte`)
   - DaisyUI: `input input-bordered w-full`
   - Variants: `input-primary`, `input-error`

7. **Textarea** (`src/lib/components/ui/Form/Textarea.svelte`)
   - DaisyUI: `textarea textarea-bordered w-full`

8. **Select/Dropdown** (`src/lib/components/ui/Form/Select.svelte`, `Dropdown.svelte`)
   - DaisyUI: `select select-bordered w-full`
   - Native select or `dropdown` component

9. **Checkbox** (`src/lib/components/ui/Form/Checkbox.svelte`)
   - DaisyUI: `checkbox checkbox-primary`

10. **Radio** (`src/lib/components/ui/Form/Radio.svelte`)
    - DaisyUI: `radio radio-primary`

11. **FileInput** (`src/lib/components/ui/Form/FileInput.svelte`)
    - DaisyUI: `file-input file-input-bordered`

12. **ValidationMessage** (`src/lib/components/ui/Form/ValidationMessage.svelte`)
    - Custom with: `text-error text-sm mt-1`

#### 2.3 Feedback Components (Week 2)

13. **Dialog** (`src/lib/components/ui/Dialog.svelte`)
    - DaisyUI: `modal`, `modal-box`, `modal-backdrop`
    - Custom: Use `<dialog>` element with DaisyUI classes

14. **ConfirmationDialog** (`src/lib/components/ConfirmationDialog.svelte`)
    - DaisyUI: `modal` + `modal-action` for buttons

15. **FeedbackMessage** (`src/lib/components/FeedbackMessage.svelte`)
    - DaisyUI: `alert`, `alert-info`, `alert-success`, `alert-error`, `alert-warning`

16. **Spinner** (`src/lib/components/Spinner.svelte`)
    - DaisyUI: `loading loading-spinner loading-lg`

#### 2.4 Table Components (Week 2)

17. **Table** (`src/lib/components/ui/Table/Table.svelte`)
    - DaisyUI: `table table-zebra`

18. **TableHead** (`src/lib/components/ui/Table/TableHead.svelte`)
    - Custom: `thead` with Tailwind classes

19. **TableBody** (`src/lib/components/ui/Table/TableBody.svelte`)
    - Custom: `tbody`

20. **TableRow** (`src/lib/components/ui/Table/TableRow.svelte`)
    - Custom: `tr hover:bg-base-200`

21. **TableCell** (`src/lib/components/ui/Table/TableCell.svelte`)
    - Custom: `td` with padding classes

---

### Phase 3: Feature Component Migration

#### 3.1 Navigation & Layout (Week 3)

22. **NavLinks** (`src/lib/components/NavLinks.svelte`)
    - DaisyUI: `navbar`, `navbar-start`, `navbar-end`
    - Custom icon buttons with `btn btn-ghost btn-circle`

23. **Sidebar** (`src/lib/components/Sidebar.svelte`)
    - DaisyUI: `drawer` or custom with Tailwind grid/flex

24. **SiteIcons** (`src/lib/components/SiteIcons.svelte`)
    - Keep as-is (PWA icons)

#### 3.2 Recipe Components (Week 3-4)

25. **RecipeCard** (`src/lib/components/RecipeCard.svelte`)
    - DaisyUI: `card card-compact bg-base-200`
    - Image: `card-body`, custom grid for image placement

26. **RecipeList** (`src/lib/components/RecipeList.svelte`)
    - Tailwind: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

27. **RecipeFilter** (`src/lib/components/RecipeFilter.svelte`)
    - Custom with form controls + Tailwind flex/grid

28. **RecipeForm** (`src/lib/components/RecipeForm.svelte`)
    - Custom form with migrated form components

29. **RecipeNewScrape** (`src/lib/components/RecipeNewScrape.svelte`)
    - Form with input + button

30. **RecipeViewButtons** (`src/lib/components/RecipeViewButtons.svelte`)
    - DaisyUI: `join` for button groups or `btn-group`

31. **RecipeViewDropdown** (`src/lib/components/RecipeViewDropdown.svelte`)
    - DaisyUI: `dropdown` + `dropdown-content`

32. **RecipeShareButton** (`src/lib/components/RecipeShareButton.svelte`)
    - Button with modal

33. **StarRating** (`src/lib/components/StarRating.svelte`)
    - DaisyUI: `rating` component with `rating-lg rating-half`

34. **Scale** (`src/lib/components/Scale.svelte`)
    - Custom with buttons and input

#### 3.3 Recipe View Sections (Week 4)

35. **RecipeViewCover** (`src/lib/components/RecipeViewCover.svelte`)
    - DaisyUI: `card` with `card-body`

36. **RecipeViewAbout** (`src/lib/components/RecipeViewAbout.svelte`)
    - DaisyUI: `card` or `stats` for metadata

37. **RecipeViewDesc** (`src/lib/components/RecipeViewDesc.svelte`)
    - DaisyUI: `card` with prose typography

38. **RecipeViewIng** (`src/lib/components/RecipeViewIng.svelte`)
    - Custom list with checkboxes

39. **RecipeViewIngs** (`src/lib/components/RecipeViewIngs.svelte`)
    - Container for ingredient items

40. **RecipeViewDirections** (`src/lib/components/RecipeViewDirections.svelte`)
    - Ordered list with Tailwind typography

41. **RecipeViewNotes** (`src/lib/components/RecipeViewNotes.svelte`)
    - DaisyUI: `card` or `alert alert-info`

42. **RecipeViewLogs** (`src/lib/components/RecipeViewLogs.svelte`)
    - Custom list with timestamps

43. **RecipeViewOtherPhotos** (`src/lib/components/RecipeViewOtherPhotos.svelte`)
    - Grid of images with Tailwind

44. **RecipeImagesItem** (`src/lib/components/RecipeImagesItem.svelte`)
    - DaisyUI: `card` for image + metadata

45. **PhotoSectionNew** (`src/lib/components/PhotoSectionNew.svelte`)
    - File upload section

46. **PhotoSectionEdit** (`src/lib/components/PhotoSectionEdit.svelte`)
    - Image management UI

#### 3.4 Shopping & Calendar (Week 5)

47. **ShoppingToolbar** (`src/lib/components/Shopping/ShoppingToolbar.svelte`)
    - Button group with Tailwind

48. **ShoppingItemInput** (`src/lib/components/Shopping/ShoppingItemInput.svelte`)
    - Form with input + button

49. **ShoppingListItem** (`src/lib/components/Shopping/ShoppingListItem.svelte`)
    - Checkbox + text + action buttons

50. **ShoppingEditDialog** (`src/lib/components/Shopping/ShoppingEditDialog.svelte`)
    - Modal with form

#### 3.5 User & Category Components (Week 5)

51. **UserCard** (`src/lib/components/UserCard.svelte`)
    - DaisyUI: `card` with user info

52. **UserList** (`src/lib/components/UserList.svelte`)
    - Grid or list of user cards

53. **CategoryTree** (`src/lib/components/CategoryTree.svelte`)
    - Hierarchical list with indentation

54. **CategoryItem** (`src/lib/components/CategoryItem.svelte`)
    - List item with drag-drop

55. **CategoryItemSimple** (`src/lib/components/CategoryItemSimple.svelte`)
    - Simple list item

56. **CategoryEdit** (`src/lib/components/CategoryEdit.svelte`)
    - Form for category CRUD

#### 3.6 Misc Components (Week 5)

57. **Oauth** (`src/lib/components/Oauth.svelte`)
    - Social login buttons

58. **Bookmarklet** (`src/lib/components/Bookmarklet.svelte`)
    - Code display + copy button

59. **TrueFalse** (`src/lib/components/TrueFalse.svelte`)
    - Toggle or switch (DaisyUI: `toggle`)

---

### Phase 4: Page Migration (Week 6-8)

#### Login & Auth Pages
- `src/routes/login/+page.svelte` - Center card with form
- `src/routes/register/+page.svelte` - Center card with form

#### Recipe Pages
- `src/routes/user/[id]/recipes/+page.svelte` - List view
- `src/routes/recipe/[uid]/+page.svelte` - Detail view
- `src/routes/recipe/[uid]/edit/+page.svelte` - Edit form
- `src/routes/user/[id]/new/+page.svelte` - New recipe form

#### Shopping & Calendar
- `src/routes/user/[id]/shopping/+page.svelte`
- `src/routes/user/[id]/calendar/+page.svelte`

#### Settings & Admin
- `src/routes/user/[id]/settings/+page.svelte`
- `src/routes/user/[id]/password/+page.svelte`
- `src/routes/user/[id]/admin/users/+page.svelte`
- `src/routes/user/[id]/admin/site/+page.svelte`

#### Import/Export
- `src/routes/user/[id]/import/+page.svelte`
- `src/routes/user/[id]/export/+page.svelte`
- `src/routes/user/[id]/upload/+page.svelte`

#### Other
- `src/routes/user/[id]/bookmark/+page.svelte`
- `src/routes/+layout.svelte` - Root layout

---

### Phase 5: Testing & Refinement (Week 8-9)

#### 5.1 Visual Testing
- Compare screenshots before/after
- Test both light and dark themes
- Verify all UI states (hover, active, disabled, error)
- Mobile responsive testing

#### 5.2 Functional Testing
- Run existing Vitest tests
- Manual testing of:
  - Recipe CRUD operations
  - Shopping list functionality
  - Calendar operations
  - User management
  - Import/export
  - Theme switching
  - PWA functionality

#### 5.3 Accessibility
- Keyboard navigation
- Screen reader testing
- Color contrast verification
- ARIA labels

#### 5.4 Performance
- Bundle size comparison
- Load time testing
- Lighthouse scores

---

## Migration Checklist by Element Type

### Colors
- [ ] Configure DaisyUI themes (light/dark with cyan primary)
- [ ] Replace all custom color references with DaisyUI semantic names:
  - `primary`, `primary-content`, `primary-focus`
  - `base-100`, `base-200`, `base-300`, `base-content`
  - `secondary`, `accent`, `neutral`
  - `info`, `success`, `warning`, `error` (with `-content` variants)
- [ ] Verify dark/light theme toggle works with `data-theme` attribute
- [ ] Test color contrast meets WCAG standards (auto-handled by DaisyUI)

### Typography
- [ ] Set Inter font in Tailwind config
- [ ] Adjust base font size (87.5%)
- [ ] Set line-height (1.25)
- [ ] Style headings (h1-h6) with font-weight: 600
- [ ] Verify text hierarchy

### Layout
- [ ] Container component with max-widths
- [ ] Grid layouts for recipe lists
- [ ] Flexbox for navigation
- [ ] Responsive breakpoints
- [ ] Spacing utilities (padding, margin)

### Forms
- [ ] Text inputs
- [ ] Textareas
- [ ] Selects/dropdowns
- [ ] Checkboxes
- [ ] Radio buttons
- [ ] File inputs
- [ ] Form validation states
- [ ] Search inputs

### Buttons
- [ ] Primary buttons
- [ ] Secondary/outline buttons
- [ ] Ghost/text buttons
- [ ] Icon buttons (circular)
- [ ] Button groups/joins
- [ ] Loading states
- [ ] Disabled states

### Cards
- [ ] Base card component
- [ ] Recipe cards
- [ ] User cards
- [ ] Card with image
- [ ] Card sections/dividers
- [ ] Card hover effects

### Navigation
- [ ] Top navbar
- [ ] Icon navigation buttons
- [ ] Logo/branding
- [ ] Mobile menu (if needed)
- [ ] Breadcrumbs (if used)

### Modals/Dialogs
- [ ] Base modal
- [ ] Confirmation dialog
- [ ] Form dialogs
- [ ] Modal backdrop
- [ ] Close button

### Lists
- [ ] Recipe list grid
- [ ] Shopping list items
- [ ] User lists
- [ ] Category trees
- [ ] Drag-drop lists

### Tables
- [ ] Base table
- [ ] Zebra striping
- [ ] Sortable headers
- [ ] Responsive tables
- [ ] Action columns

### Icons
- [ ] Verify SVG components still work
- [ ] Update icon button styling
- [ ] Icon + text combinations

### Special Components
- [ ] Star rating
- [ ] Calendar (Event Calendar integration)
- [ ] Image galleries
- [ ] File upload previews
- [ ] Spinners/loading indicators
- [ ] Alerts/notifications
- [ ] Tooltips
- [ ] Badges

---

## Breaking Changes to Watch For

### PicoCSS → DaisyUI Mapping

| PicoCSS Pattern | DaisyUI/Tailwind Equivalent |
|----------------|----------------------------|
| `<article>` semantic cards | `<div class="card bg-base-200">` |
| `<button>` auto-styled | `<button class="btn btn-primary">` |
| `<input>` auto-styled | `<input class="input input-bordered">` |
| `role="button"` link buttons | `<a class="btn">` |
| `outline` class | `btn-outline` |
| `contrast` variant | `btn-accent` or `btn-secondary` |
| `data-theme` attribute | Same (compatible!) ✓ |
| `--pico-primary` variable | `bg-primary`, `text-primary` classes |
| `--pico-background-color` | `bg-base-100` |
| `--pico-card-background-color` | `bg-base-200` |
| `--pico-muted-color` | `text-base-content/70` |
| `<nav>` auto-styled | `<nav class="navbar">` |
| `<table>` semantic | `<table class="table">` |

**DaisyUI Color Classes to Use:**
- Backgrounds: `bg-base-100`, `bg-base-200`, `bg-base-300`
- Text: `text-base-content`, `text-primary`, `text-secondary`
- Borders: `border-base-300`, `border-neutral`
- States: `bg-success`, `bg-error`, `bg-warning`, `bg-info`

### Potential Issues
1. **Semantic HTML loss:** PicoCSS auto-styles elements; DaisyUI requires classes
2. **Specificity:** May need to add `!important` or adjust layer order
3. **JavaScript interactions:** Modals, dropdowns may need JS updates
4. **SVG icons:** Ensure sizing classes work correctly
5. **Third-party integrations:** Event Calendar may need style adjustments
6. **Form validation:** Different error state styling approach
7. **Animation/transitions:** Different defaults, may need custom config

---

## File Structure Changes

### New Files
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration
- `src/app.css` - Global Tailwind imports

### Modified Files
- `src/routes/+layout.svelte` - Update CSS import
- `package.json` - Update dependencies
- All component files (gradual migration)

### Deleted Files/Folders
- `src/lib/css/` - Entire folder (SCSS files)
- `node_modules/@picocss/` - PicoCSS dependency

---

## Rollback Plan

If migration encounters critical issues:

1. **Git:** `git checkout main` (keep `redesign` branch for later)
2. **Dependencies:** PicoCSS remains in `main` branch
3. **Staged Migration:** Migrate components individually, test each
4. **Feature Flag:** Could add runtime flag to toggle between PicoCSS/DaisyUI if needed

---

## Success Metrics

- [ ] All 95+ files migrated without visual regressions
- [ ] Dark/light theme working perfectly
- [ ] All existing tests passing
- [ ] No accessibility regressions
- [ ] Bundle size acceptable (target: <10% increase)
- [ ] Load time maintained or improved
- [ ] Mobile responsive on all pages
- [ ] PWA functionality intact

---

## Timeline Estimate

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1: Setup | 1 day | Install, configure, test basic setup |
| Phase 2: UI Primitives | 1 week | Buttons, forms, tables, dialogs |
| Phase 3: Feature Components | 2-3 weeks | Recipe components, shopping, users |
| Phase 4: Page Migration | 2-3 weeks | All route pages |
| Phase 5: Testing & Polish | 1-2 weeks | QA, fixes, documentation |
| **Total** | **6-9 weeks** | Full migration |

---

## Notes & Considerations

### Pros of DaisyUI
- Pre-built, accessible components
- Active development and community
- Excellent documentation
- Easy customization via Tailwind config
- Works seamlessly with Tailwind utilities
- Smaller learning curve than custom Tailwind

### Cons of DaisyUI
- More verbose HTML (classes on everything)
- Larger bundle size than PicoCSS
- May need custom components for complex UI
- Some components require JavaScript

### Why This Migration Makes Sense
1. **PicoCSS limitations:** Fewer components, less flexibility
2. **Tailwind ecosystem:** Massive plugin ecosystem
3. **Future-proofing:** DaisyUI actively maintained
4. **Design control:** Easier to customize and extend
5. **Developer experience:** Better IDE support, IntelliSense

### Risks
- **Time investment:** 6-9 weeks of work
- **Bundle size:** Tailwind + DaisyUI larger than PicoCSS
- **Breaking changes:** Potential for bugs during migration
- **Learning curve:** Team needs to learn utility-first approach

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Prototype:** Build 2-3 key pages to validate approach
3. **Create migration scripts:** Automate where possible
4. **Set up CI/CD:** Ensure tests run on `redesign` branch
5. **Begin Phase 1:** Install and configure tooling
6. **Iterate:** Migrate components incrementally, test continuously
7. **Document:** Update CLAUDE.md with new patterns

---

## Resources

- [DaisyUI Documentation](https://daisyui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Tailwind + Svelte Guide](https://tailwindcss.com/docs/guides/sveltekit)
- [PicoCSS to Tailwind Migration Examples](https://github.com/search?q=pico+tailwind+migration)
- Current screenshots: `docs/scripts/docs/images/`

---

**Last Updated:** 2025-12-30
**Author:** Migration Planning
**Version:** 1.0
