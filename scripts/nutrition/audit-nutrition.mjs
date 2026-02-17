import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const dbPath = path.join(process.cwd(), 'prisma', 'db', 'dev.sqlite')
const outputDir = path.join(process.cwd(), 'tmp', 'nutrition-audit')

fs.mkdirSync(outputDir, { recursive: true })

const query = `SELECT uid, name, REPLACE(REPLACE(COALESCE(nutritional_info,''), char(9), ' '), char(10), '\\n')
FROM Recipe
WHERE nutritional_info IS NOT NULL
AND TRIM(nutritional_info) <> '';`

const raw = execSync(`sqlite3 -separator '\t' "${dbPath}" "${query}"`, {
	encoding: 'utf8'
})

const rows = raw
	.split('\n')
	.filter(Boolean)
	.map((line) => {
		const [uid, name, nutritionRaw = ''] = line.split('\t')
		return {
			uid,
			name,
			nutritional_info: nutritionRaw.replace(/\\n/g, '\n')
		}
	})

const classify = (text) => {
	const lower = text.toLowerCase()
	if (lower.includes('nutrition facts')) return 'nutrition_facts'
	if (text.includes('|')) return 'kv_pipe'
	if (text.includes(';')) return 'sentence'
	if (text.includes('\n')) return 'kv_newline'
	if (lower.includes('per serving')) return 'per_serving_sentence'
	return 'other'
}

const patterns = {}
const candidates = []

for (const row of rows) {
	const text = row.nutritional_info || ''
	const shape = classify(text)
	patterns[shape] = (patterns[shape] || 0) + 1

	const numericTokens = (text.match(/\d+(?:[.,]\d+)?/g) || []).length
	const delimiterTokens = text.split(/\n|\||;/).filter((token) => /\d/.test(token)).length
	const roughCoverage = numericTokens > 0 ? Number((delimiterTokens / numericTokens).toFixed(3)) : 0

	if (shape === 'other' || roughCoverage < 0.3) {
		candidates.push({
			uid: row.uid,
			name: row.name,
			shape,
			roughCoverage,
			sample: text.slice(0, 220).replace(/\n/g, ' ⏎ ')
		})
	}
}

const tsvHeader = 'uid\tname\tnutritional_info\n'
const tsvBody = rows
	.map((row) => {
		const escapedName = String(row.name || '')
			.replace(/\t/g, ' ')
			.replace(/\n/g, ' ')
		const escapedNutrition = String(row.nutritional_info || '')
			.replace(/\t/g, ' ')
			.replace(/\n/g, ' \\n ')
		return `${row.uid}\t${escapedName}\t${escapedNutrition}`
	})
	.join('\n')

fs.writeFileSync(path.join(outputDir, 'nutrition_raw.tsv'), tsvHeader + tsvBody)
fs.writeFileSync(
	path.join(outputDir, 'nutrition_summary.json'),
	JSON.stringify(
		{
			runAt: new Date().toISOString(),
			totalRows: rows.length,
			patterns,
			topLikelyUnparsed: candidates.sort((a, b) => a.roughCoverage - b.roughCoverage).slice(0, 30)
		},
		null,
		2
	)
)

console.log(`Wrote ${rows.length} rows to ${path.relative(process.cwd(), outputDir)}`)
