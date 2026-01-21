import { execSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const tmpBase = path.join(process.cwd(), 'tests', '.tmp')
fs.mkdirSync(tmpBase, { recursive: true })
const tmpRoot = fs.mkdtempSync(path.join(tmpBase, 'e2e-'))
const dbPath = path.join(tmpRoot, 'e2e.sqlite')
const relativeDbPath = path.relative(process.cwd(), dbPath).split(path.sep).join('/')
const databaseUrl = `file:./${relativeDbPath}`

// Ensure sqlite file exists before running migrations.
fs.writeFileSync(dbPath, '', { flag: 'a' })

const env = {
	...process.env,
	DATABASE_URL: databaseUrl,
	ORIGIN: 'http://127.0.0.1:4173'
}

const cleanup = () => {
	try {
		fs.rmSync(tmpRoot, { recursive: true, force: true })
	} catch (error) {
		console.error('Failed to clean up e2e temp directory:', error)
	}
}

try {
	execSync('pnpm prisma generate', { stdio: 'inherit', env })
	execSync('pnpm prisma migrate deploy', { stdio: 'inherit', env })
	execSync('pnpm seed', { stdio: 'inherit', env })
	execSync('pnpm build', { stdio: 'inherit', env })
} catch (error) {
	cleanup()
	process.exit(typeof error?.status === 'number' ? error.status : 1)
}

const preview = spawn('node', ['build/index.js'], {
	stdio: 'inherit',
	env: {
		...env,
		PORT: '4173',
		HOST: '127.0.0.1'
	}
})

const shutdown = (signal) => {
	if (preview && !preview.killed) {
		preview.kill(signal)
	}
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

preview.on('exit', (code) => {
	cleanup()
	process.exit(code ?? 0)
})
