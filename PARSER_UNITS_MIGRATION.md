# Parser Units Consolidation - Migration Plan

## Overview

Consolidate the four separate unit objects (`units`, `pluralUnits`, `symbolUnits`, `unitSystems`) in each language file into a single unified `unitsData` object.

## Goals

1. **Single source of truth** - All unit data in one object
2. **Backwards compatible** - Old code continues working during migration
3. **Gradual migration** - Change usage site-by-site, keeping tests green
4. **Parser independence** - Parser remains standalone, usable by other apps
5. **Rich metadata** - Add conversion factors, unit types, display preferences

## New Structure

### Each Language File (e.g., `lang.eng.js`)

```javascript
// NEW: Unified unit data
const unitsData = {
  // WEIGHT UNITS
  gram: {
    names: ['gram', 'grams', 'g', 'g.', 'gs', 'gs.'],
    plural: 'grams',
    symbol: 'g',
    system: 'metric',
    unitType: 'weight',
    conversionFactor: { grams: 1 },
    skipConversion: false,
    decimalPlaces: 2
  },

  kilogram: {
    names: ['kilogram', 'kilo gram', 'kilograms', 'kilo grams', 'kg', 'kg.'],
    plural: 'kilograms',
    symbol: 'kg',
    system: 'metric',
    unitType: 'weight',
    conversionFactor: { grams: 1000 },
    skipConversion: false,
    decimalPlaces: 2
  },

  ounce: {
    names: ['ounce', 'oz', 'oz.'],
    plural: 'ounces',
    symbol: 'oz',
    system: 'imperial',
    unitType: 'weight',
    conversionFactor: { grams: 28.35 },
    skipConversion: false,
    decimalPlaces: 1
  },

  // VOLUME UNITS
  cup: {
    names: ['cup', 'c', 'c.'],
    plural: 'cups',
    symbol: 'c',
    system: 'americanVolumetric',
    unitType: 'volume',
    conversionFactor: { milliliters: 236.588 },
    skipConversion: false,
    decimalPlaces: 2
  },

  tablespoon: {
    names: ['tablespoon', 'tbs', 'tbsp', 'tbspn', 'tbs.', 'tbsp.', 'tbspn.'],
    plural: 'tablespoons',
    symbol: 'tbs',
    system: 'americanVolumetric',
    unitType: 'volume',
    conversionFactor: { milliliters: 14.787 },
    skipConversion: false,
    decimalPlaces: 2
  },

  teaspoon: {
    names: ['teaspoon', 'tsp', 'tspn', 't', 't.', 'tsp.', 'tspn.'],
    plural: 'teaspoons',
    symbol: 'tsp',
    system: 'americanVolumetric',
    unitType: 'volume',
    conversionFactor: { milliliters: 4.929 },
    skipConversion: false,
    decimalPlaces: 2
  },

  milliliter: {
    names: ['milliliter', 'ml', 'ml.', 'millilitre', 'millilitres'],
    plural: 'milliliters',
    symbol: 'ml',
    system: 'metric',
    unitType: 'volume',
    conversionFactor: { milliliters: 1 },
    skipConversion: false,
    decimalPlaces: 1
  },

  liter: {
    names: ['liter', 'l', 'l.', 'lt', 'lt.', 'litre', 'litres'],
    plural: 'liters',
    symbol: 'lt',
    system: 'metric',
    unitType: 'volume',
    conversionFactor: { milliliters: 1000 },
    skipConversion: false,
    decimalPlaces: 2
  },

  // COUNT/CONTAINER UNITS (no conversion)
  piece: {
    names: ['piece', 'pcs', 'pcs.'],
    plural: 'pieces',
    symbol: '',
    system: null,
    unitType: 'count',
    conversionFactor: null,
    skipConversion: true,
    decimalPlaces: 0
  },

  pinch: {
    names: ['pinch', 'pinches', 'pinchs', 'pn.', 'pn', 'pns.', 'pns'],
    plural: 'pinches',
    symbol: '',
    system: null,
    unitType: 'count',
    conversionFactor: null,
    skipConversion: true,
    decimalPlaces: 0
  },

  // ... all other units
}

// OLD: Generate from unitsData for backwards compatibility
const units = Object.fromEntries(
  Object.entries(unitsData).map(([key, data]) => [key, data.names])
)

const pluralUnits = Object.fromEntries(
  Object.entries(unitsData).map(([key, data]) => [key, data.plural])
)

const symbolUnits = Object.fromEntries(
  Object.entries(unitsData).map(([key, data]) => [key, data.symbol])
)

const unitSystems = Object.fromEntries(
  Object.entries(unitsData)
    .filter(([_, data]) => data.system)
    .map(([key, data]) => [key, data.system])
)

export const langEng = {
  // NEW
  unitsData,

  // OLD (auto-generated, still works)
  units,
  pluralUnits,
  symbolUnits,
  unitSystems,

  // Other exports remain unchanged
  prepositions,
  joiners,
  toTaste,
  toTasteAdditional,
  additionalStopwords,
  approx,
  optional,
  toServe,
  instructions,
  adverbs,
  numbersSmall,
  numbersMagnitude,
  problematicUnits,
  isCommaDelimited: false
}
```

## Migration Phases

### Phase 1: ✅ COMPLETE - Add New Structure (No Breaking Changes)

**Completed Tasks**:
1. ✅ Added `unitsData` object to `lang.eng.js` with all English units
2. ✅ Auto-generated old objects from `unitsData` to maintain compatibility
3. ✅ Exported both old and new structures
4. ✅ Created comprehensive tests to verify backwards compatibility
5. ⏳ TODO: Repeat for remaining language files (deu, ita, esp, fra, por, rus, hin, ind, ara)

**Results**:
- ✅ All 480 parser tests passing
- ✅ All 63 converter tests passing
- ✅ Zero breaking changes - full backwards compatibility maintained
- ✅ New `unitsData` structure includes:
  - Complete unit metadata (names, plural, symbol, system)
  - Unit type classification (weight, volume, count, length)
  - Conversion factors (grams for weight, milliliters for volume)
  - Skip conversion flags
  - Decimal places for display

**Files to modify**:
- `src/lib/submodules/recipe-ingredient-parser/src/i18n/lang.eng.js`
- `src/lib/submodules/recipe-ingredient-parser/src/i18n/lang.deu.js`
- `src/lib/submodules/recipe-ingredient-parser/src/i18n/lang.ita.js`
- ... (all language files)

**Test**:
```javascript
// Verify backwards compatibility
const { units, unitsData } = langEng

// Old way still works
assert(units.gram.includes('g'))

// New way works too
assert(unitsData.gram.names.includes('g'))
assert(unitsData.gram.symbol === 'g')
```

### Phase 2: 🔄 Migrate Parser Code

**Main usage location**: `src/lib/submodules/recipe-ingredient-parser/src/utils/parser-helpers.js`

#### Current Code (uses old objects):
```javascript
const {units, pluralUnits, symbolUnits, problematicUnits} = langMap;

// Finding units
for (const unit of Object.keys(units)) {
  for (const unitVariant of units[unit]) {
    // ... matching logic
  }
}

// Getting plural
const plural = pluralUnits[unit]

// Getting symbol
const symbol = symbolUnits[unit]
```

#### New Code (uses unitsData):
```javascript
const {unitsData, problematicUnits} = langMap;

// Finding units
for (const [unitKey, unitData] of Object.entries(unitsData)) {
  for (const unitVariant of unitData.names) {
    // ... matching logic
  }
}

// Getting plural
const plural = unitsData[unit].plural

// Getting symbol
const symbol = unitsData[unit].symbol
```

**Tasks**:
1. Update `getUnit()` helper in parser-helpers.js
2. Update `getUnitAndRemainder()` function
3. Update any other unit lookups in parser
4. Test thoroughly with all languages

### Phase 3: 🔄 Migrate Vanilla-Cookbook Code

**Main usage locations**:
- `src/lib/utils/converter.js` - Unit conversion logic
- `src/lib/utils/units.js` - Unit utilities

#### Current Code:
```javascript
import { units } from './units.js'

// Find unit
const fromUnits = units.find(u => u.names.includes(unit)) || {}
const fromUnit = fromUnits.names[0]
```

#### New Code:
```javascript
import { i18nMap } from '$lib/submodules/recipe-ingredient-parser/src/i18n'

function findUnitData(unitName, language = 'eng') {
  const langData = i18nMap[language]

  for (const [canonical, data] of Object.entries(langData.unitsData)) {
    if (data.names.includes(unitName.toLowerCase())) {
      return { canonical, ...data }
    }
  }

  return null
}

// Usage
const unitData = findUnitData(unit)
if (unitData) {
  // Access: unitData.names, unitData.plural, unitData.symbol
  // New: unitData.unitType, unitData.conversionFactor
}
```

**Tasks**:
1. Create helper functions in converter.js to work with unitsData
2. Update `manipulateIngredient()` to use new structure
3. Update `normalizeIngredient()` to use new structure
4. Add support for `unitType` and `conversionFactor`
5. Test all conversion scenarios

### Phase 4: ✅ Remove Old Objects

Once all code is migrated:

```javascript
// lang.eng.js - AFTER migration complete

const unitsData = {
  // ... all units
}

export const langEng = {
  unitsData,  // ONLY export this now

  // OLD objects removed:
  // units,
  // pluralUnits,
  // symbolUnits,
  // unitSystems,

  prepositions,
  joiners,
  // ... other exports
}
```

**Tasks**:
1. Remove old object generation code
2. Remove old object exports
3. Verify no code references old objects
4. Update documentation

### Phase 5: 🔮 Future: Multi-Language Consolidation (Optional)

Eventually, could consolidate all languages into one file:

```javascript
// unitsData.js (centralized)
export const unitsData = {
  gram: {
    names: {
      eng: ['gram', 'grams', 'g', 'g.'],
      deu: ['gramm', 'g', 'g.'],
      ita: ['grammi', 'grammo', 'gr', 'gr.'],
      esp: ['gramo', 'gramos', 'g', 'g.']
    },
    plural: {
      eng: 'grams',
      deu: 'Gramm',
      ita: 'grammi',
      esp: 'gramos'
    },
    symbol: 'g',  // Universal
    system: 'metric',
    unitType: 'weight',
    conversionFactor: { grams: 1 },
    skipConversion: false,
    decimalPlaces: 2
  }
}
```

## Usage in Parser vs. Vanilla-Cookbook

### Parser (Internal Use)

Parser uses `unitsData` for:
- Recognizing unit names in ingredient text
- Returning plural forms
- Returning symbols
- Classifying unit systems

```javascript
// In parser's getUnitAndRemainder()
const langData = i18nMap[language]

for (const [canonical, unitData] of Object.entries(langData.unitsData)) {
  if (unitData.names.includes(matchedText)) {
    return {
      unit: canonical,
      unitPlural: unitData.plural,
      symbol: unitData.symbol
    }
  }
}
```

### Vanilla-Cookbook (External Use)

App imports from parser and adds conversion logic:

```javascript
import { i18nMap } from '$lib/submodules/recipe-ingredient-parser/src/i18n'

const langData = i18nMap['eng']
const cupData = langData.unitsData.cup

// Parser provides: names, plural, symbol, system
// Conversion uses: unitType, conversionFactor, skipConversion, decimalPlaces

if (cupData.unitType === 'volume' && toUnit.unitType === 'volume') {
  const ml = quantity * cupData.conversionFactor.milliliters
  const result = ml / toUnit.conversionFactor.milliliters
}
```

## Benefits

### Before (Current)

**Problems**:
- Data duplicated across 4 objects
- Adding a unit requires updating 4 places
- No conversion metadata in parser
- Hard to extend with new metadata

```javascript
// Adding a new unit - must update 4 places!
const units = {
  newunit: ['new', 'nu', 'n']  // ← Place 1
}
const pluralUnits = {
  newunit: 'newunits'  // ← Place 2
}
const symbolUnits = {
  newunit: 'nu'  // ← Place 3
}
const unitSystems = {
  newunit: 'metric'  // ← Place 4
}
```

### After (New)

**Benefits**:
- Single object to maintain
- Adding a unit is one addition
- Rich metadata for conversion
- Easy to extend with new fields

```javascript
// Adding a new unit - single addition!
const unitsData = {
  newunit: {
    names: ['new', 'nu', 'n'],
    plural: 'newunits',
    symbol: 'nu',
    system: 'metric',
    unitType: 'weight',
    conversionFactor: { grams: 5 },
    skipConversion: false,
    decimalPlaces: 2
  }
}
```

## Testing Strategy

### 1. Backwards Compatibility Tests

```javascript
describe('Generated old objects match unitsData', () => {
  it('units object matches names', () => {
    const { units, unitsData } = langEng

    for (const [key, names] of Object.entries(units)) {
      expect(names).toEqual(unitsData[key].names)
    }
  })

  it('pluralUnits matches plural', () => {
    const { pluralUnits, unitsData } = langEng

    for (const [key, plural] of Object.entries(pluralUnits)) {
      expect(plural).toEqual(unitsData[key].plural)
    }
  })
})
```

### 2. Migration Tests

```javascript
describe('Parser uses unitsData correctly', () => {
  it('recognizes all unit variants', () => {
    const result = parse('1 cup flour', 'eng')
    expect(result.unit).toBe('cup')
    expect(result.unitPlural).toBe('cups')
    expect(result.symbol).toBe('c')
  })
})

describe('Converter uses unitsData correctly', () => {
  it('converts using conversionFactor', () => {
    const result = convertUnits(1, 'cup', 'milliliter')
    expect(result).toBeCloseTo(236.588, 2)
  })
})
```

### 3. Integration Tests

Run existing test suites to ensure nothing breaks:
- Parser tests (33 tests)
- Converter tests (63 tests)
- Integration tests (13 tests)

## Timeline

- **Phase 1**: 2-3 hours (add unitsData to all language files)
- **Phase 2**: 3-4 hours (migrate parser code)
- **Phase 3**: 4-5 hours (migrate vanilla-cookbook code)
- **Phase 4**: 1 hour (remove old objects)
- **Total**: ~10-15 hours

## Success Criteria

- [ ] All language files have `unitsData` object
- [ ] Old objects auto-generated from `unitsData`
- [ ] Parser uses `unitsData` instead of old objects
- [ ] Vanilla-cookbook uses `unitsData` via parser import
- [ ] All 109 existing tests still pass
- [ ] Can add new unit in single place
- [ ] Multi-language conversion works (German "gramm" converts to English "ounce")
- [ ] Old objects removed, no backwards compatibility code remains

## Next Steps

1. Review and approve this plan
2. Start Phase 1: Add `unitsData` to `lang.eng.js`
3. Generate old objects from new data
4. Test backwards compatibility
5. Proceed to Phase 2 when ready
