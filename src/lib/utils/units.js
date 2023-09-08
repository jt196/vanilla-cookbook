/**
 * Represents an array of unit objects.
 * @type {Object[]}
 * @property {string[]} names - Different names for a given unit.
 * @property {number} grams - The gram equivalent of the unit.
 * @property {boolean} skipConversion - Whether to skip conversion, often used for volumetric units like teaspoons.
 * @property {number} decimalPlaces - Number of decimal places for display.
 */
export const units = [
	{
		names: [
			'drop',
			'drops',
			'dr.',
			'dr',
			'drs.',
			'drs',
			'gt.',
			'gt',
			'gts.',
			'gts',
			'gtt',
			'gtt.',
			'gtts',
			'gtts.'
		],
		grams: 0.05,
		skipConversion: true,
		decimalPlaces: 0
	},
	{
		names: [
			'smidgen',
			'smidgens',
			'smdg.',
			'smdg',
			'smdgs.',
			'smdgs',
			'smi',
			'smi.',
			'smis.',
			'smis'
		],
		grams: 0.18,
		skipConversion: true,
		decimalPlaces: 0
	},
	{
		names: ['pinch', 'pinches', 'pinchs', 'pn.', 'pn', 'pns.', 'pns'],
		grams: 0.36,
		skipConversion: true,
		decimalPlaces: 0
	},
	{
		names: ['dash', 'dashs', 'dashes', 'ds.', 'ds', 'dss.', 'dss'],
		grams: 0.72,
		skipConversion: true,
		decimalPlaces: 0
	},
	{
		names: [
			'saltspoon',
			'salt spoon',
			'saltspoons',
			'salt spoons',
			'scruple',
			'scruples',
			'ssp.',
			'ssp',
			'ssps.',
			'ssps'
		],
		grams: 17.1,
		skipConversion: true,
		decimalPlaces: 1
	},
	{
		names: [
			'coffeespoon',
			'coffee spoon',
			'coffeespoons',
			'coffee spoons',
			'csp.',
			'csp',
			'csps.',
			'csps'
		],
		grams: 2.1,
		skipConversion: true,
		decimalPlaces: 0
	},
	{
		names: [
			'fluid dram',
			'fluiddram',
			'fluid drams',
			'fluiddrams',
			'fl.dr.',
			'fldr',
			'fl.dr',
			'fldr.',
			'fl.drs.',
			'fldrs',
			'fl.drs'
		],
		grams: 3.69,
		skipConversion: true,
		decimalPlaces: 0
	},
	{
		names: [
			'teaspoon',
			'tea spoon',
			'teaspoons',
			'tea spoons',
			'tsp.',
			'tsp',
			'tsps.',
			'tsps',
			't.',
			't',
			'ts.',
			'ts'
		],
		grams: 4.92,
		skipConversion: true,
		decimalPlaces: 1
	},
	{
		names: [
			'dessertspoon',
			'dessert spoon',
			'dessertspoons',
			'dessert spoons',
			'dsp.',
			'dsp',
			'dsps.',
			'dsps',
			'dssp.',
			'dssp',
			'dssps.',
			'dssps',
			'dstspn.',
			'dstspn',
			'dstspns.',
			'dstspns'
		],
		grams: 9.85,
		skipConversion: true,
		decimalPlaces: 1
	},
	{
		names: [
			'tablespoon',
			'table spoon',
			'tablespoons',
			'table spoons',
			'tbsp.',
			'tbsp',
			'tbsps.',
			'tbsps',
			'T.',
			'T',
			'Ts.',
			'Ts'
		],
		grams: 14.78,
		skipConversion: true,
		decimalPlaces: 1
	},
	{
		names: [
			'fluid ounce',
			'fluidounce',
			'fluid ounces',
			'fluidounces',
			'fl.oz.',
			'floz',
			'fl.oz',
			'floz.',
			'fl.ozs.',
			'flozs',
			'fl.ozs',
			'flozs.'
		],
		grams: 29.5735, // or 29.57 if you want to round it
		skipConversion: false,
		decimalPlaces: 1
	},
	{
		names: ['ounce', 'ounces', 'oz.', 'oz', 'ozs.', 'ozs'],
		grams: 28.3495,
		skipConversion: false,
		decimalPlaces: 1
	},
	{
		names: [
			'wineglass',
			'wine glass',
			'wineglasses',
			'wine glasses',
			'wgf.',
			'wgf',
			'wgfs.',
			'wgfs'
		],
		grams: 59.14,
		skipConversion: true,
		decimalPlaces: 1
	},
	{
		names: [
			'gill',
			'gills',
			'teacup',
			'tea cup',
			'teacups',
			'tea cups',
			'tcf.',
			'tcf',
			'tcfs.',
			'tcfs'
		],
		grams: 118.29,
		skipConversion: true,
		decimalPlaces: 2
	},
	{
		names: ['cup', 'cups', 'C.', 'C', 'c.', 'c', 'Cs.', 'Cs'],
		grams: 236.588,
		skipConversion: false,
		decimalPlaces: 2
	},
	{
		names: ['pint', 'pints', 'pt.', 'pt', 'pts.', 'pts'],
		grams: 473.176,
		skipConversion: false,
		decimalPlaces: 2
	},
	{
		names: ['quart', 'quarts', 'qt.', 'qt', 'qts.', 'qts'],
		grams: 946.353,
		skipConversion: false,
		decimalPlaces: 2
	},
	{
		names: ['gallon', 'gallons', 'gal.', 'gal', 'gals.', 'gals'],
		grams: 3785.41,
		skipConversion: false,
		decimalPlaces: 3
	},
	{
		names: ['pound', 'pounds', 'lb.', 'lb', 'lbs.', 'lbs'],
		grams: 453.592,
		skipConversion: false,
		decimalPlaces: 2
	},
	{ names: ['gram', 'grams', 'g.', 'g', 'gs.', 'gs'], grams: 1, skipConversion: false },
	{
		names: ['kilogram', 'kilo gram', 'kilograms', 'kilo grams', 'kg.', 'kg', 'kgs.', 'kgs'],
		grams: 1000,
		skipConversion: false,
		decimalPlaces: 2
	},
	{
		names: ['liter', 'liters', 'litre', 'litres', 'l.', 'l', 'ls.', 'ls'],
		grams: 1000,
		skipConversion: false,
		decimalPlaces: 2
	},
	{
		names: ['milliliter', 'milliliters', 'millilitre', 'millilitres', 'ml.', 'ml', 'mls.', 'mls'],
		grams: 1,
		skipConversion: false,
		decimalPlaces: 2
	}
]

/**
 * Determines if a unit should skip conversion based on its name.
 * @param {string} unit - The name of the unit.
 * @returns {boolean} - Returns true if the unit should skip conversion, otherwise false.
 */
export function shouldSkipConversion(unit) {
	const unitObj = units.find((u) => u.names.includes(unit))
	return unitObj ? unitObj.skipConversion : false
}

/**
 * Finds a suitable unit for a given system and quantity in grams.
 * @param {string} system - The system to use ('imperial', 'metric', or 'americanVolumetric').
 * @param {number} quantityInGrams - The quantity in grams.
 * @returns {string} - The name of the suitable unit.
 */
export const findSuitableUnit = (system, quantityInGrams) => {
	if (system === 'imperial') {
		const ounces = quantityInGrams / 28.3495
		if (ounces >= 16) {
			return 'pound'
		} else {
			return 'ounce'
		}
	} else if (system === 'metric') {
		if (quantityInGrams >= 1000) {
			return 'kilogram'
		} else {
			return 'gram'
		}
	} else if (system === 'americanVolumetric') {
		const cups = quantityInGrams / 236.588
		if (cups >= 1 / 8) {
			return 'cup'
		} else if (cups >= 1 / 16) {
			return 'tablespoon'
		} else {
			return 'teaspoon'
		}
	}
	return 'gram' // default
}
