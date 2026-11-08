#!/usr/bin/env node
/**
 * Type-check the app's JSDoc-annotated JavaScript and Svelte with svelte-check (checkJs),
 * as a ratchet: fail if the error count rises above the committed baseline.
 *
 *   pnpm check:types            # check against scripts/type-baseline.json
 *   pnpm check:types --update   # after fixing errors, lower the baseline
 *
 * Errors in the ingredient-parser submodule and generated files under static/ are not
 * counted; they belong to other projects or build output.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'

const BASELINE_FILE = new URL('./type-baseline.json', import.meta.url)
const IGNORED = ['src/lib/submodules/', 'static/']

spawnSync('pnpm', ['exec', 'svelte-kit', 'sync'], { stdio: 'inherit' })
const run = spawnSync(
	'pnpm',
	['exec', 'svelte-check', '--tsconfig', './jsconfig.check.json', '--output', 'machine'],
	{ encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
)
const lines = (run.stdout || '').split('\n')
if (!lines.some((line) => line.includes(' COMPLETED '))) {
	console.error(run.stdout, run.stderr)
	console.error('svelte-check did not complete')
	process.exit(2)
}

// Machine format: <timestamp> ERROR "<file>" <line>:<col> "<message>"
const errors = lines
	.filter((line) => / ERROR "/.test(line))
	.map((line) => {
		const [, file, position, message] = line.match(/ERROR "([^"]+)" (\d+:\d+) "(.*)"$/) || []
		return { file, position, message }
	})
	.filter(({ file }) => file && !IGNORED.some((prefix) => file.startsWith(prefix)))

const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')).errors
const count = errors.length

if (process.argv.includes('--update')) {
	if (count > baseline) {
		console.error(`Refusing to raise the baseline (${baseline} -> ${count}). Fix the new errors.`)
		process.exit(1)
	}
	fs.writeFileSync(BASELINE_FILE, JSON.stringify({ errors: count }, null, '\t') + '\n')
	console.log(`Type error baseline: ${baseline} -> ${count}`)
	process.exit(0)
}

const byFile = Object.entries(
	errors.reduce((acc, { file }) => ({ ...acc, [file]: (acc[file] || 0) + 1 }), {})
).sort((a, b) => b[1] - a[1])

if (count > baseline) {
	console.error(`Type errors went up: ${count} (baseline ${baseline}).\n`)
	for (const { file, position, message } of errors) {
		console.error(`${file}:${position} ${message.split('\\n')[0]}`)
	}
	console.error('\nFix the new errors (svelte-check output above, most files listed first):')
	for (const [file, n] of byFile.slice(0, 15)) console.error(`  ${n}\t${file}`)
	process.exit(1)
}

console.log(`Type check OK: ${count} errors (baseline ${baseline}).`)
if (count < baseline) {
	console.log(`Fewer errors than the baseline, so lock it in: pnpm check:types --update`)
}
