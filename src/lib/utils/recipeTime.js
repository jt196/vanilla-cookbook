import parseIsoDuration from 'parse-iso-duration'

/**
 * Recipe times (prep, cook, total) are typed as free text and stored in two forms:
 *
 * - the text column (`prep_time`, ...): an ISO 8601 duration such as `PT1H30M` when the text
 *   converts without losing anything, so every user sees it in their own language; otherwise
 *   the text exactly as written ("overnight", "2-3 hours", "about 20 minutes")
 * - the minutes column (`prep_minutes`, ...): whole minutes whenever the text reads as a
 *   duration (the upper end of a range), used to filter and sort; null when it doesn't
 */

/**
 * @typedef {Object} ParsedRecipeTime
 * @property {string|null} text - Value for the text column: ISO 8601 when lossless, else the trimmed input.
 * @property {number|null} minutes - Whole minutes, or null when the text isn't a duration.
 * @property {boolean} lossless - True when `text` was converted to ISO 8601 (or already was).
 */

/**
 * @typedef {Object} RecipeTimeFields
 * @property {string|null} prep_time
 * @property {string|null} cook_time
 * @property {string|null} total_time
 * @property {number|null} prep_minutes
 * @property {number|null} cook_minutes
 * @property {number|null} total_minutes
 */

/** Seconds per unit, keyed by unit word in each UI language (lowercase). */
const UNIT_SECONDS = {}

/**
 * @param {number} seconds
 * @param {string[]} words
 */
function addUnits(seconds, words) {
	for (const word of words) UNIT_SECONDS[word.normalize('NFKC')] = seconds
}

addUnits(604800, [
	'w',
	'wk',
	'wks',
	'week',
	'weeks',
	'woche',
	'wochen',
	'settimana',
	'settimane',
	'semana',
	'semanas',
	'semaine',
	'semaines',
	'неделя',
	'недели',
	'недель',
	'सप्ताह',
	'हफ़्ता',
	'हफ़्ते',
	'हफ्ता',
	'हफ्ते',
	'minggu',
	'أسبوع',
	'أسابيع',
	'hét',
	'hetet',
	'týden',
	'týdny',
	'týdnů',
	'weken'
])
addUnits(86400, [
	'd',
	'day',
	'days',
	'tag',
	'tage',
	'tagen',
	'giorno',
	'giorni',
	'día',
	'días',
	'dia',
	'dias',
	'jour',
	'jours',
	'день',
	'дня',
	'дней',
	'दिन',
	'hari',
	'يوم',
	'أيام',
	'ايام',
	'nap',
	'napot',
	'den',
	'dny',
	'dní',
	'dag',
	'dagen'
])
addUnits(3600, [
	'h',
	'hr',
	'hrs',
	'hour',
	'hours',
	'std',
	'stunde',
	'stunden',
	'ora',
	'ore',
	'hora',
	'horas',
	'heure',
	'heures',
	'ч',
	'час',
	'часа',
	'часов',
	'घंटा',
	'घंटे',
	'jam',
	'ساعة',
	'ساعات',
	'óra',
	'órát',
	'ó',
	'hod',
	'hodina',
	'hodiny',
	'hodin',
	'u',
	'uur',
	'uren'
])
addUnits(60, [
	'm',
	'mn',
	'min',
	'mins',
	'minute',
	'minutes',
	'minuten',
	'minuto',
	'minuti',
	'minutos',
	'мин',
	'минута',
	'минуты',
	'минут',
	'मिनट',
	'menit',
	'دقيقة',
	'دقائق',
	'perc',
	'percet',
	'p',
	'minuta',
	'minuty',
	'minut',
	'minuut'
])
addUnits(1, [
	's',
	'sec',
	'secs',
	'second',
	'seconds',
	'sek',
	'sekunde',
	'sekunden',
	'secondo',
	'secondi',
	'segundo',
	'segundos',
	'seconde',
	'secondes',
	'сек',
	'секунда',
	'секунды',
	'секунд',
	'सेकंड',
	'detik',
	'ثانية',
	'ثوان',
	'ثواني',
	'másodperc',
	'mp',
	'sekunda',
	'sekundy',
	'sekund',
	'seconden'
])

/** Arabic dual forms carry their own number ("two hours"). */
const ARABIC_DUALS = {
	يومين: 86400,
	يومان: 86400,
	ساعتين: 3600,
	ساعتان: 3600,
	دقيقتين: 60,
	دقيقتان: 60,
	ثانيتين: 1,
	ثانيتان: 1
}

/** Words that join parts ("1 hour and 30 minutes"); dropping them loses nothing. */
const JOINERS = ['and', 'und', 'e', 'y', 'et', 'и', 'और', 'dan', 'و', 'és', 'a', 'en']

/** Words that hedge a time; it still filters, but the text is kept as written. */
const HEDGES = [
	'about',
	'approx',
	'approximately',
	'around',
	'roughly',
	'ca',
	'circa',
	'etwa',
	'ungefähr',
	'circa',
	'environ',
	'unos',
	'unas',
	'aproximadamente',
	'cerca',
	'de',
	'sekitar',
	'около',
	'примерно',
	'حوالي',
	'लगभग',
	'kb',
	'körülbelül',
	'asi',
	'přibližně',
	'ongeveer',
	'up',
	'to',
	'under',
	'less',
	'than',
	'within',
	'max'
]

/** Words between the two ends of a range ("2 to 3 hours"). */
const RANGE_WORDS = [
	'to',
	'or',
	'bis',
	'oder',
	'a',
	'à',
	'ou',
	'o',
	'до',
	'से',
	'sampai',
	'hingga',
	'إلى',
	'až',
	'tot',
	'of'
]

/** @param {string[]} words */
const alternation = (words) =>
	[...new Set(words)]
		.sort((a, b) => b.length - a.length)
		.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
		.join('|')

const NUM = String.raw`\d+(?:[.,]\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+`
const RANGE_SEP = String.raw`\s*(?:-|(?:${alternation(RANGE_WORDS)})(?![\p{L}\p{M}]))\s*`
const NOT_LETTER = String.raw`(?![\p{L}\p{M}])`
const NOT_AFTER_LETTER = String.raw`(?<![\p{L}\p{M}\d])`

const QUANTITY_RE = new RegExp(
	String.raw`${NOT_AFTER_LETTER}(?<from>${NUM})(?:${RANGE_SEP}(?<to>${NUM}))?\s*(?<unit>${alternation(Object.keys(UNIT_SECONDS))})\.?${NOT_LETTER}(?:\s*(?<trail>\d{1,2})${NOT_LETTER}(?!\s*[\d\p{L}]))?`,
	'giu'
)
const DUAL_RE = new RegExp(
	`${NOT_AFTER_LETTER}(${alternation(Object.keys(ARABIC_DUALS))})${NOT_LETTER}`,
	'gu'
)
// "55 mins to 1 hr": the lower end of a range whose ends both carry units
const LOWER_END_RE = new RegExp(
	String.raw`${NOT_AFTER_LETTER}(?:${NUM})\s*(?:${alternation(Object.keys(UNIT_SECONDS))})\.?${RANGE_SEP}(?=(?:${NUM})\s*(?:${alternation(Object.keys(UNIT_SECONDS))})${NOT_LETTER})`,
	'giu'
)
// "an hour", "eine Stunde", "ساعة واحدة": a unit with a word for one instead of a number
const UNITS = alternation(Object.keys(UNIT_SECONDS))
const ONE_WORDS = [
	'a',
	'an',
	'one',
	'ein',
	'eine',
	'einen',
	'un',
	'une',
	'uno',
	'una',
	'um',
	'uma',
	'один',
	'одна',
	'одну',
	'एक',
	'satu',
	'egy',
	'jeden',
	'jedna',
	'jednu',
	'een'
]
const ONE_BEFORE_RE = new RegExp(
	`${NOT_AFTER_LETTER}(?:${alternation(ONE_WORDS)})\\s+(${UNITS})${NOT_LETTER}`,
	'giu'
)
const ONE_AFTER_RE = new RegExp(
	`${NOT_AFTER_LETTER}(${UNITS})\\s+(?:واحدة|واحد)${NOT_LETTER}`,
	'giu'
)
/** Number words, so "six minutes" or "zwanzig Minuten" read like "6 minutes". */
const NUMBER_WORDS = {
	// English
	zero: 0,
	two: 2,
	three: 3,
	four: 4,
	five: 5,
	six: 6,
	seven: 7,
	eight: 8,
	nine: 9,
	ten: 10,
	eleven: 11,
	twelve: 12,
	thirteen: 13,
	fourteen: 14,
	fifteen: 15,
	sixteen: 16,
	seventeen: 17,
	eighteen: 18,
	nineteen: 19,
	twenty: 20,
	thirty: 30,
	forty: 40,
	fifty: 50,
	sixty: 60,
	ninety: 90,
	// German
	zwei: 2,
	drei: 3,
	vier: 4,
	fünf: 5,
	sechs: 6,
	sieben: 7,
	acht: 8,
	neun: 9,
	zehn: 10,
	elf: 11,
	zwölf: 12,
	fünfzehn: 15,
	zwanzig: 20,
	dreißig: 30,
	vierzig: 40,
	fünfundvierzig: 45,
	fünfzig: 50,
	sechzig: 60,
	neunzig: 90,
	// French
	deux: 2,
	trois: 3,
	quatre: 4,
	cinq: 5,
	sept: 7,
	huit: 8,
	neuf: 9,
	dix: 10,
	onze: 11,
	douze: 12,
	quinze: 15,
	vingt: 20,
	trente: 30,
	quarante: 40,
	cinquante: 50,
	soixante: 60,
	// Spanish
	dos: 2,
	tres: 3,
	cuatro: 4,
	cinco: 5,
	seis: 6,
	siete: 7,
	ocho: 8,
	nueve: 9,
	diez: 10,
	doce: 12,
	quince: 15,
	veinte: 20,
	treinta: 30,
	cuarenta: 40,
	cincuenta: 50,
	sesenta: 60,
	// Italian
	due: 2,
	tre: 3,
	quattro: 4,
	cinque: 5,
	sei: 6,
	sette: 7,
	otto: 8,
	nove: 9,
	dieci: 10,
	dodici: 12,
	quindici: 15,
	venti: 20,
	trenta: 30,
	quaranta: 40,
	sessanta: 60,
	// Portuguese
	dois: 2,
	duas: 2,
	três: 3,
	sete: 7,
	oito: 8,
	dez: 10,
	doze: 12,
	vinte: 20,
	trinta: 30,
	quarenta: 40,
	cinquenta: 50,
	sessenta: 60,
	// Dutch
	twee: 2,
	drie: 3,
	vijf: 5,
	zes: 6,
	zeven: 7,
	negen: 9,
	tien: 10,
	twaalf: 12,
	vijftien: 15,
	twintig: 20,
	dertig: 30,
	veertig: 40,
	vijftig: 50,
	zestig: 60,
	// Russian
	два: 2,
	две: 2,
	три: 3,
	четыре: 4,
	пять: 5,
	шесть: 6,
	семь: 7,
	восемь: 8,
	девять: 9,
	десять: 10,
	пятнадцать: 15,
	двадцать: 20,
	тридцать: 30,
	сорок: 40,
	пятьдесят: 50
}
const NUMBER_WORD_RE = new RegExp(
	`${NOT_AFTER_LETTER}(${alternation(Object.keys(NUMBER_WORDS))})${NOT_LETTER}`,
	'giu'
)
// "twenty-five", "thirty five"
const EN_COMPOUND_RE =
	/(?<![\p{L}])(twenty|thirty|forty|fifty)[\s-]+(one|two|three|four|five|six|seven|eight|nine)(?![\p{L}])/giu

/** Halves and quarters said in words: "half an hour", "an hour and a half", "anderthalb Stunden". */
const HALF_PHRASES = /** @type {Array<[RegExp, string]>} */ ([
	[/(?<![\p{L}])(?:a\s+)?half\s+an?\s+hour(?![\p{L}])/giu, '30 min'],
	[/(?<![\p{L}])(?:a\s+)?quarter\s+of\s+an\s+hour(?![\p{L}])/giu, '15 min'],
	[/(?<![\p{L}])(?:eine\s+)?(?:halbe|halben)\s+stunde(?![\p{L}])/giu, '30 min'],
	[/(?<![\p{L}])(?:une\s+)?demi[\s-]heure(?![\p{L}])/giu, '30 min'],
	[/(?<![\p{L}])media\s+hora(?![\p{L}])/giu, '30 min'],
	[/(?<![\p{L}])meia\s+hora(?![\p{L}])/giu, '30 min'],
	[/(?<![\p{L}])mezz['’]?\s?ora(?![\p{L}])/giu, '30 min'],
	[/(?<![\p{L}])(?:een\s+)?half\s+uur(?![\p{L}])/giu, '30 min'],
	[/(?<![\p{L}])полчаса(?![\p{L}])/giu, '30 min'],
	[/(?<![\p{L}])(?:anderthalb|eineinhalb|anderhalf|полтора|полторы)(?![\p{L}])/giu, '1.5'],
	// "1 and a half hours", "1 hour and a half", "une heure et demie", "hora y media"
	[/(\d+)\s+(?:and\s+a\s+half|und\s+eine?\s+halbe?)(?![\p{L}])/giu, '$1.5'],
	[
		/(\d+)\s+([\p{L}]+)\s+(?:and\s+a\s+half|et\s+demie?|y\s+media|e\s+meia|e\s+mezzo|e\s+mezza|en\s+een\s+half)(?![\p{L}])/giu,
		'$1.5 $2'
	]
])

/**
 * Turn number words and spoken halves into digits ("six minutes" → "6 minutes").
 * @param {string} text - Already normalised text.
 * @returns {string}
 */
function wordsToNumbers(text) {
	// Halves first, before "an hour" becomes "1 hour"; again after, for "1 hour and a half"
	let out = HALF_PHRASES.reduce(
		(acc, [pattern, replacement]) => acc.replace(pattern, replacement),
		text
	)
	out = out.replace(
		EN_COMPOUND_RE,
		(_, tens, unit) =>
			` ${NUMBER_WORDS[/** @type {keyof typeof NUMBER_WORDS} */ (tens)] + NUMBER_WORDS[/** @type {keyof typeof NUMBER_WORDS} */ (unit)]} `
	)
	out = out.replace(ONE_BEFORE_RE, '1 $1').replace(ONE_AFTER_RE, '1 $1')
	out = out.replace(NUMBER_WORD_RE, (word) =>
		String(NUMBER_WORDS[/** @type {keyof typeof NUMBER_WORDS} */ (word.toLowerCase())])
	)
	for (const [pattern, replacement] of HALF_PHRASES) out = out.replace(pattern, replacement)
	return out.trim()
}

const BARE_RE = new RegExp(String.raw`^(?<from>${NUM})(?:${RANGE_SEP}(?<to>${NUM}))?$`, 'iu')
const CLOCK_RE = /^(\d{1,2}):([0-5]\d)$/
const ISO_RE = /^P(?:\d+(?:\.\d+)?[YMWD])*(?:T(?:\d+(?:\.\d+)?[HMS])+)?$/
const FILLER_RE = new RegExp(
	String.raw`${NOT_AFTER_LETTER}(?:${alternation([...JOINERS, ...HEDGES])})${NOT_LETTER}|[\s,.;:+&()~≈-]`,
	'giu'
)
const HEDGE_RE = new RegExp(`${NOT_AFTER_LETTER}(?:${alternation(HEDGES)})${NOT_LETTER}|[~≈]`, 'iu')

const VULGAR_FRACTIONS = { '½': ' 1/2', '¼': ' 1/4', '¾': ' 3/4', '⅓': ' 1/3', '⅔': ' 2/3' }

/**
 * Lowercase, fold Arabic, Persian and Devanagari digits and Unicode fractions/dashes to ASCII.
 * @param {string} text
 * @returns {string}
 */
function normalise(text) {
	return text
		.replace(/[½¼¾⅓⅔]/g, (c) => VULGAR_FRACTIONS[/** @type {keyof typeof VULGAR_FRACTIONS} */ (c)])
		.normalize('NFKC')
		.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
		.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
		.replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966))
		.replace(/[⁄∕]/g, '/')
		.replace(/[–—−]/g, '-')
		.toLowerCase()
		.trim()
}

/**
 * Read a quantity: "2", "1.5", "1,5", "1/2", "1 1/2".
 * @param {string} text
 * @returns {number}
 */
function toNumber(text) {
	return text
		.replace(',', '.')
		.split(/\s+/)
		.reduce((sum, part) => {
			const [num, den] = part.split('/')
			return sum + (den ? Number(num) / Number(den) : Number(num))
		}, 0)
}

/**
 * Whether a value is an ISO 8601 duration ("PT1H30M") as stored for recipe times.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isIsoDuration(value) {
	if (typeof value !== 'string' || value.trim().length < 2) return false
	const text = value.trim().toUpperCase()
	if (!ISO_RE.test(text)) return false
	try {
		parseIsoDuration(text)
		return true
	} catch {
		return false
	}
}

/**
 * Seconds to an ISO 8601 duration using hours, minutes and seconds ("PT1H30M").
 * @param {number} seconds
 * @returns {string}
 */
export function secondsToIso(seconds) {
	const total = Math.round(seconds)
	const h = Math.floor(total / 3600)
	const m = Math.floor((total % 3600) / 60)
	const s = total % 60
	if (!h && !m && !s) return 'PT0M'
	return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s ? `${s}S` : ''}`
}

/**
 * Minutes to an ISO 8601 duration ("PT1H30M").
 * @param {number} minutes
 * @returns {string}
 */
export function minutesToIso(minutes) {
	return secondsToIso(minutes * 60)
}

/**
 * Seconds to whole minutes; anything above zero is at least one minute.
 * @param {number} seconds
 * @returns {number}
 */
function toMinutes(seconds) {
	return seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : 0
}

/**
 * Read a recipe time typed as text, in any of the app's languages.
 *
 * - ISO 8601 ("PT1H30M") is kept as is
 * - "1 hour 30 minutes", "1h30", "1:30", "90 min", "1 ½ Stunden", "2 часа" become ISO 8601
 * - ranges ("2-3 hours") and hedged times ("about 20 min") keep their text; minutes use the upper end
 * - a bare number ("45") is read as minutes, keeping the text
 * - anything else ("overnight", "2 hours plus chilling") keeps its text, with no minutes
 *
 * @param {unknown} value - The typed time.
 * @returns {ParsedRecipeTime}
 */
export function parseRecipeTime(value) {
	const raw = value == null ? '' : String(value).trim()
	if (!raw) return { text: null, minutes: null, lossless: false }

	if (isIsoDuration(raw)) {
		const iso = raw.toUpperCase()
		return { text: iso, minutes: toMinutes(parseIsoDuration(iso) / 1000), lossless: true }
	}

	const text = wordsToNumbers(normalise(raw))
	const notDuration = { text: raw, minutes: null, lossless: false }

	const clock = text.match(CLOCK_RE)
	if (clock) {
		const seconds = Number(clock[1]) * 3600 + Number(clock[2]) * 60
		return { text: secondsToIso(seconds), minutes: toMinutes(seconds), lossless: true }
	}

	const bare = text.match(BARE_RE)
	if (bare?.groups) {
		const minutes = toNumber(bare.groups.to ?? bare.groups.from)
		return { text: raw, minutes: Math.round(minutes), lossless: false }
	}

	let seconds = 0
	let ranged = false
	let found = false
	const rest = text
		.replace(LOWER_END_RE, () => {
			ranged = true
			return ' '
		})
		.replace(QUANTITY_RE, (...args) => {
			const { from, to, unit, trail } = args.at(-1)
			const unitSeconds = UNIT_SECONDS[unit.toLowerCase()]
			// "1h30" / "2 Std 15": a bare number after hours is minutes
			if (trail && unitSeconds !== 3600) return args[0].replace(/\s*\d{1,2}$/, ' \u0000')
			found = true
			if (to) ranged = true
			seconds += toNumber(to ?? from) * unitSeconds + (trail ? Number(trail) * 60 : 0)
			return ' '
		})
		.replace(DUAL_RE, (match) => {
			found = true
			seconds += 2 * ARABIC_DUALS[/** @type {keyof typeof ARABIC_DUALS} */ (match)]
			return ' '
		})

	if (!found || rest.replace(FILLER_RE, '').length > 0) return notDuration

	const minutes = toMinutes(seconds)
	if (ranged || HEDGE_RE.test(rest)) return { text: raw, minutes, lossless: false }
	return { text: secondsToIso(seconds), minutes, lossless: true }
}

/**
 * Normalise a recipe's three times: text columns to ISO 8601 where lossless, plus the minute
 * columns. Total minutes fall back to prep + cook when there's no total and every time given
 * reads as a duration.
 *
 * @param {{ prep_time?: unknown, cook_time?: unknown, total_time?: unknown }} recipe
 * @returns {RecipeTimeFields}
 */
export function recipeTimeFields(recipe) {
	const prep = parseRecipeTime(recipe.prep_time)
	const cook = parseRecipeTime(recipe.cook_time)
	const total = parseRecipeTime(recipe.total_time)

	let totalMinutes = total.minutes
	if (totalMinutes == null && !total.text) {
		const parts = [prep, cook].filter((p) => p.text)
		if (parts.length && parts.every((p) => p.minutes != null)) {
			totalMinutes = parts.reduce((sum, p) => sum + /** @type {number} */ (p.minutes), 0)
		}
	}

	return {
		prep_time: prep.text,
		cook_time: cook.text,
		total_time: total.text,
		prep_minutes: prep.minutes,
		cook_minutes: cook.minutes,
		total_minutes: totalMinutes
	}
}

/**
 * Best-known overall time of a recipe in minutes, for filtering: the total, else prep + cook.
 * @param {{ total_minutes?: number|null, prep_minutes?: number|null, cook_minutes?: number|null }} recipe
 * @returns {number|null}
 */
export function recipeReadyMinutes(recipe) {
	if (recipe.total_minutes != null) return recipe.total_minutes
	if (recipe.prep_minutes == null && recipe.cook_minutes == null) return null
	return (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0)
}
