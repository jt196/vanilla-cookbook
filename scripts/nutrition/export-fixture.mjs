import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const dbPath = path.join(process.cwd(), 'prisma', 'db', 'dev.sqlite')
const outPath = path.join(process.cwd(), 'src', 'tests', 'fixtures', 'nutrition-sample.json')

const sql = `SELECT uid, name, nutritional_info FROM Recipe WHERE nutritional_info IS NOT NULL AND TRIM(nutritional_info) <> '' ORDER BY uid;`
const json = execSync(`sqlite3 -json "${dbPath}" "${sql}"`, { encoding: 'utf8' })

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, json)

const count = JSON.parse(json).length
console.log(`Wrote ${count} records to ${outPath}`)
