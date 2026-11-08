#!/usr/bin/env node
/**
 * Type-check the app's JSDoc-annotated JavaScript and Svelte with svelte-check (checkJs).
 * Fails on any type error.
 *
 *   pnpm check:types
 *
 * Errors in the ingredient-parser submodule and generated files under static/ are not
 * counted; they belong to other projects or build output.
 */
import { spawnSync } from 'node:child_process'

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

if (errors.length) {
	for (const { file, position, message } of errors) {
		console.error(`${file}:${position} ${message.replace(/\\n/g, '\n    ')}`)
	}
	console.error(`\n${errors.length} type error${errors.length === 1 ? '' : 's'}.`)
	process.exit(1)
}

console.log('Type check OK: no errors.')
