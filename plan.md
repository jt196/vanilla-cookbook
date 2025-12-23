## Ingredient UI refresh plan

Goal: surface the new parser fields (approx, optional, toServe, instructions, unitSystem, alternatives, per-item quantities) without overwhelming the list.

### Display principles
- Keep default view dense and readable; show only the primary quantity/unit/ingredient inline.
- Use lightweight affordances (icons + hover/expand) for secondary data.
- Keep typography consistent with current list; avoid tables unless expanded.

### Proposed UI elements
- Inline badges/icons:
  - `~` badge for approx.
  - `opt` badge for optional.
  - `serve` badge for to-serve.
  - `•` badge for “has alternatives”; click/hover reveals alternatives.
- Instructions/state:
  - Show as a trailing muted string (e.g., “— finely chopped, rinsed”) or behind a disclosure chevron that toggles per line.
- Unit system hint:
  - Small superscript tag on the unit (e.g., `g¹` with a legend “¹ metric”) or a single legend at the list footer when mixed systems exist.
- Alternatives:
  - On click/hover of an “alts” badge, show a popover listing alt quantity/unit/ingredient; allow swapping one in (optional future).
  - If an alternative is an ingredient-only “or” entry, show as “Alt: quinoa”.
- Multipliers/per-item:
  - If `multiplier` exists, render “(per item: 100 g)” in muted text; keep total quantity as primary.
- Additional notes:
  - Keep current italicized footnote style; append any extra `additional` text there.

### Interaction patterns (without tables)
- Per-line hover toolbar (mobile-friendly via tap):
  - Buttons/icons: info (opens popover with instructions/notes/alternatives), swap (future), copy.
- Collapsible “Details” section under each ingredient on toggle; defaults closed.
- Footer legend:
  - Explain badges and unit system tag once to reduce per-line clutter.

### Minimal implementation slice
1) Inline badges for approx/optional/toServe/toTaste + muted instructions tail.
2) Popover/details for alternatives (shows alt qty/unit/system/ingredient).
3) Footer legend for unit-system tags; highlight mixed systems.
4) Render `additional` and per-item info inline or in the popover/details.

### Risks/mitigations
- Visual clutter: keep badges small and use legend; collapse details by default.
- Mobile usability: tap-to-toggle details instead of hover only.
- Mixed systems confusion: explicit legend and per-item system tags.

### Alternative display logic (parser output → UI)
- Data shape: `ingredient` + `quantity/minQty/maxQty/unit/unitPlural/symbol/unitSystem` and `alternatives[]` entries with the same fields (plus optional instructions/additional).
- Classification rules per alternative (case-insensitive trim on ingredient/unit):
  - **Alt unit/weight**: ingredient matches primary but unit or unitSystem differs (quantity may differ); display as “1 oz (imperial)” next to primary “28 g (metric)”.
  - **Alt ingredient, same qty**: quantity/minQty/maxQty equal and unit/unitSystem equal; display as “or: coconut milk”.
  - **Alt ingredient, different qty**: ingredient differs and either quantity or unit differs; display as “alt: 18 g coconut milk”.
  - **Ingredient-only alts**: no qty/unit; label as “or: <ingredient>” without numbers.
- Rendering algorithm:
  1) Primary line shows main qty/unit/ingredient + badges (approx/optional/toServe) and instruction tail.
  2) If `alternatives.length > 0`, show a compact badge “alts”.
  3) On expand/popover, list each alternative with a tag:
     - `unit`: use for alt unit/weight variants.
     - `ingredient`: same qty/unit, different ingredient.
     - `ingredient+qty`: both differ.
     - `ingredient-only`: no qty/unit.
     Include unitSystem tag when present.
  4) If alt has instructions/additional, show them inline in the alt row (muted).
  5) Keep per-item fields consistent: if primary has perItemQuantity, mirror on alts when available; otherwise omit.

### Phase plan (checkboxes)
- [ ] **Phase 1 (MVP UI)**: badges for approx/optional/toServe/toTaste; instruction tail; per-item hint in-line (e.g., “(per item: 50 g)” after the main line); unit-system superscript + legend; alternatives button with simple details dropdown; toggle row converted to compact buttons; converter dropdown replaced by a 3-button segmented control (Metric / US Vol / Imperial) on its own row above toggles, with active style = primary.
- [ ] **Phase 2 (Polish)**: improved alternatives popover styling and classification tags; optional copy/swap actions; better mobile spacing and tap targets; refine legends/icons.
- [ ] **Phase 3 (Nice-to-have)**: persistence of toggle states per user; animation polish; accessibility audit (keyboard focus for badges/popover).
