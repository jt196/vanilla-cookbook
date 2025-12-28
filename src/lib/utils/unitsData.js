/**
 * Unified Unit Data System
 *
 * Consolidates unit information from:
 * - recipe-ingredient-parser i18n (names, plurals, symbols, systems)
 * - converter units.js (conversion factors, formatting rules)
 *
 * This is the new single source of truth for all unit data.
 * The old systems (units.js and parser i18n) will be gradually migrated to use this.
 */

/**
 * Unified unit data structure.
 *
 * Each unit has a canonical name (the key) and contains:
 * - names: Array of all variants/aliases for this unit
 * - plural: Plural form for display
 * - symbol: Short symbol (e.g., "g", "oz")
 * - system: Measurement system ('metric', 'imperial', 'americanVolumetric', or null)
 * - grams: Conversion factor to grams (null if not a weight/doesn't convert to grams)
 * - skipConversion: Whether to skip this unit in conversion operations
 * - decimalPlaces: Number of decimal places for display (default: 2)
 *
 * @type {Object.<string, {names: string[], plural: string, symbol: string, system: string|null, grams: number|null, skipConversion: boolean, decimalPlaces: number}>}
 */
export const unitsData = {
	// ===== VERY SMALL UNITS (skip conversion) =====
	drop: {
		names: ['drop', 'drops', 'dr.', 'dr', 'drs.', 'drs', 'gt.', 'gt', 'gts.', 'gts', 'gtt', 'gtt.', 'gtts', 'gtts.'],
		plural: 'drops',
		symbol: '',
		system: null,
		grams: 0.05,
		skipConversion: true,
		decimalPlaces: 0
	},

	smidgen: {
		names: ['smidgen', 'smidgens', 'smdg.', 'smdg', 'smdgs.', 'smdgs', 'smi', 'smi.', 'smis.', 'smis'],
		plural: 'smidgens',
		symbol: '',
		system: null,
		grams: 0.18,
		skipConversion: true,
		decimalPlaces: 0
	},

	pinch: {
		names: ['pinch', 'pinches', 'pinchs', 'pn.', 'pn', 'pns.', 'pns'],
		plural: 'pinches',
		symbol: '',
		system: null,
		grams: 0.36,
		skipConversion: true,
		decimalPlaces: 0
	},

	dash: {
		names: ['dash', 'dashs', 'dashes', 'ds.', 'ds', 'dss.', 'dss', 'splash', 'splashes'],
		plural: 'dashes',
		symbol: '',
		system: null,
		grams: 0.72,
		skipConversion: true,
		decimalPlaces: 0
	},

	// ===== VOLUME UNITS - AMERICAN VOLUMETRIC =====
	teaspoon: {
		names: ['teaspoon', 'tsp', 'tspn', 't', 't.', 'tsp.', 'tspn.', 't/s', 'ts', 'ts.'],
		plural: 'teaspoons',
		symbol: 'tsp',
		system: 'americanVolumetric',
		grams: null, // Volume unit, converts via ingredient density
		skipConversion: false,
		decimalPlaces: 2
	},

	tablespoon: {
		names: ['tablespoon', 'tbs', 'tbsp', 'tbspn', 'tbs.', 'tbsp.', 'tbspn.'],
		plural: 'tablespoons',
		symbol: 'tbs',
		system: 'americanVolumetric',
		grams: null,
		skipConversion: false,
		decimalPlaces: 2
	},

	cup: {
		names: ['cup', 'c', 'c.'],
		plural: 'cups',
		symbol: 'c',
		system: 'americanVolumetric',
		grams: null,
		skipConversion: false,
		decimalPlaces: 2
	},

	pint: {
		names: ['pint', 'pt', 'pts', 'pt.', 'pts.'],
		plural: 'pints',
		symbol: 'pt',
		system: 'americanVolumetric',
		grams: null,
		skipConversion: false,
		decimalPlaces: 2
	},

	quart: {
		names: ['quart', 'qt', 'qt.', 'qts', 'qts.'],
		plural: 'quarts',
		symbol: 'qt',
		system: 'americanVolumetric',
		grams: null,
		skipConversion: false,
		decimalPlaces: 2
	},

	gallon: {
		names: ['gallon', 'gal', 'gal.'],
		plural: 'gallons',
		symbol: 'gal',
		system: 'americanVolumetric',
		grams: null,
		skipConversion: false,
		decimalPlaces: 2
	},

	// ===== VOLUME UNITS - METRIC =====
	milliliter: {
		names: ['milliliter', 'ml', 'ml.', 'millilitre', 'millilitres'],
		plural: 'milliliters',
		symbol: 'ml',
		system: 'metric',
		grams: null, // 1ml water = 1g, but varies by ingredient
		skipConversion: false,
		decimalPlaces: 1
	},

	liter: {
		names: ['liter', 'l', 'l.', 'lt', 'lt.', 'litre', 'litres'],
		plural: 'liters',
		symbol: 'lt',
		system: 'metric',
		grams: null,
		skipConversion: false,
		decimalPlaces: 2
	},

	// ===== VOLUME UNITS - IMPERIAL =====
	floz: {
		names: ['fl oz', 'fl.oz', 'fl oz.', 'fl.oz.', 'fluid ounce', 'fluid ounces', 'fl. ounce', 'fl. ounces'],
		plural: 'fluid ounces',
		symbol: 'fl oz',
		system: 'imperial',
		grams: null,
		skipConversion: false,
		decimalPlaces: 1
	},

	// ===== WEIGHT UNITS - METRIC =====
	milligram: {
		names: ['milligram', 'mg', 'mg.'],
		plural: 'milligrams',
		symbol: 'mg',
		system: 'metric',
		grams: 0.001,
		skipConversion: false,
		decimalPlaces: 1
	},

	gram: {
		names: ['gram', 'grams', 'g.', 'g', 'gs.', 'gs'],
		plural: 'grams',
		symbol: 'g',
		system: 'metric',
		grams: 1,
		skipConversion: false,
		decimalPlaces: 2
	},

	kilogram: {
		names: ['kilogram', 'kilo gram', 'kilograms', 'kilo grams', 'kg.', 'kg', 'kgs.', 'kgs'],
		plural: 'kilograms',
		symbol: 'kg',
		system: 'metric',
		grams: 1000,
		skipConversion: false,
		decimalPlaces: 2
	},

	// ===== WEIGHT UNITS - IMPERIAL =====
	ounce: {
		names: ['ounce', 'oz', 'oz.'],
		plural: 'ounces',
		symbol: 'oz',
		system: 'imperial',
		grams: 28.35,
		skipConversion: false,
		decimalPlaces: 1
	},

	pound: {
		names: ['pound', 'lb', 'lb.', 'lbs', 'lbs.', 'Lb', 'Lbs', 'Lb.', 'Lbs.'],
		plural: 'pounds',
		symbol: 'lb',
		system: 'imperial',
		grams: 453.592,
		skipConversion: false,
		decimalPlaces: 2
	},

	// ===== COUNT/CONTAINER UNITS (no standard conversion) =====
	clove: {
		names: ['clove'],
		plural: 'cloves',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	piece: {
		names: ['piece', 'pcs', 'pcs.'],
		plural: 'pieces',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	slice: {
		names: ['slice'],
		plural: 'slices',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	stick: {
		names: ['stick', 'sticks'],
		plural: 'sticks',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	dozen: {
		names: ['dozen'],
		plural: 'dozen',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	pack: {
		names: ['package', 'pkg', 'pkgs', 'pkg.', 'pkgs.', 'pack', 'packet', 'packets'],
		plural: 'packs',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	bag: {
		names: ['bag', 'bg', 'bg.'],
		plural: 'bags',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	box: {
		names: ['box'],
		plural: 'boxes',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	bottle: {
		names: ['bottle', 'btl', 'btl.'],
		plural: 'bottles',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	can: {
		names: ['can'],
		plural: 'cans',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	container: {
		names: ['container', 'cont', 'cont.'],
		plural: 'containers',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	// ===== MEASUREMENT/SERVING UNITS =====
	handful: {
		names: ['handful'],
		plural: 'handfuls',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	bunch: {
		names: ['bunch', 'bunches'],
		plural: 'bunches',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	serving: {
		names: ['serving', 'servings', 'portion', 'portions'],
		plural: 'servings',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	squirt: {
		names: ['squirt', 'squirts'],
		plural: 'squirts',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	drizzle: {
		names: ['drizzle'],
		plural: 'drizzles',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	// ===== LENGTH UNITS =====
	inch: {
		names: ['inch'],
		plural: 'inches',
		symbol: 'in',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 1
	},

	centimetre: {
		names: ['centimeter', 'centimetre', 'cm', 'cm.'],
		plural: 'centimetres',
		symbol: 'cm',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 1
	},

	// ===== MISCELLANEOUS =====
	ear: {
		names: ['ear'],
		plural: 'ears',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	knob: {
		names: ['knob'],
		plural: 'knobs',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	thumb: {
		names: ['thumb'],
		plural: 'thumbs',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	},

	block: {
		names: ['block'],
		plural: 'blocks',
		symbol: '',
		system: null,
		grams: null,
		skipConversion: true,
		decimalPlaces: 0
	}
}

/**
 * Find canonical unit name and metadata from any variant name.
 *
 * @param {string} unitString - The unit string to look up (e.g., "g", "grams", "oz")
 * @returns {{canonical: string, names: string[], plural: string, symbol: string, system: string|null, grams: number|null, skipConversion: boolean, decimalPlaces: number}|null} Unit data or null if not found
 *
 * @example
 * findUnitFromName('g')
 * // Returns: { canonical: 'gram', names: ['gram', 'grams', 'g', ...], plural: 'grams', symbol: 'g', ... }
 *
 * findUnitFromName('gramm') // German variant (not yet in English-only data)
 * // Returns: null (until multi-language support added)
 */
export function findUnitFromName(unitString) {
	const normalized = unitString.toLowerCase()

	for (const [canonical, data] of Object.entries(unitsData)) {
		if (data.names.includes(normalized)) {
			return {
				canonical,
				...data
			}
		}
	}

	return null
}

/**
 * Get complete data for a canonical unit name.
 *
 * @param {string} canonical - The canonical unit name (e.g., 'gram', 'cup')
 * @returns {{names: string[], plural: string, symbol: string, system: string|null, grams: number|null, skipConversion: boolean, decimalPlaces: number}|null} Unit data or null if not found
 *
 * @example
 * getUnitData('gram')
 * // Returns: { names: ['gram', 'grams', ...], plural: 'grams', symbol: 'g', system: 'metric', grams: 1, ... }
 */
export function getUnitData(canonical) {
	return unitsData[canonical] || null
}

/**
 * Convert to old units.js format for backwards compatibility.
 *
 * This allows gradual migration - old code can continue using the flat array
 * structure while new code uses the enhanced unitsData object.
 *
 * @returns {Array<{names: string[], grams: number, skipConversion: boolean, decimalPlaces: number}>}
 *
 * @example
 * const oldFormatUnits = toOldUnitsFormat()
 * // Returns: [{ names: ['gram', 'grams', 'g', ...], grams: 1, skipConversion: false, decimalPlaces: 2 }, ...]
 */
export function toOldUnitsFormat() {
	return Object.values(unitsData).map(data => ({
		names: data.names,
		grams: data.grams || 0, // Old format expects a number, not null
		skipConversion: data.skipConversion,
		decimalPlaces: data.decimalPlaces
	}))
}

/**
 * Convert to parser i18n format for backwards compatibility.
 *
 * Generates the separate units, pluralUnits, symbolUnits, unitSystems objects
 * that the parser currently expects.
 *
 * @returns {{units: Object, pluralUnits: Object, symbolUnits: Object, unitSystems: Object}}
 *
 * @example
 * const i18nFormat = toParserI18nFormat()
 * // Returns: {
 * //   units: { gram: ['gram', 'grams', 'g', ...], ... },
 * //   pluralUnits: { gram: 'grams', ... },
 * //   symbolUnits: { gram: 'g', ... },
 * //   unitSystems: { gram: 'metric', ... }
 * // }
 */
export function toParserI18nFormat() {
	const units = {}
	const pluralUnits = {}
	const symbolUnits = {}
	const unitSystems = {}

	for (const [canonical, data] of Object.entries(unitsData)) {
		units[canonical] = data.names
		pluralUnits[canonical] = data.plural
		symbolUnits[canonical] = data.symbol
		if (data.system) {
			unitSystems[canonical] = data.system
		}
	}

	return { units, pluralUnits, symbolUnits, unitSystems }
}

/**
 * Get all unit names that belong to a specific measurement system.
 *
 * @param {string} system - The system ('metric', 'imperial', 'americanVolumetric')
 * @returns {string[]} Array of canonical unit names
 *
 * @example
 * getUnitsForSystem('metric')
 * // Returns: ['milligram', 'gram', 'kilogram', 'milliliter', 'liter']
 */
export function getUnitsForSystem(system) {
	return Object.entries(unitsData)
		.filter(([_, data]) => data.system === system)
		.map(([canonical, _]) => canonical)
}

/**
 * Check if a unit should skip conversion.
 *
 * @param {string} unitString - Unit name (canonical or variant)
 * @returns {boolean} True if conversion should be skipped
 *
 * @example
 * shouldSkipUnitConversion('pinch') // Returns: true
 * shouldSkipUnitConversion('gram')  // Returns: false
 */
export function shouldSkipUnitConversion(unitString) {
	const unitData = findUnitFromName(unitString)
	return unitData ? unitData.skipConversion : false
}
