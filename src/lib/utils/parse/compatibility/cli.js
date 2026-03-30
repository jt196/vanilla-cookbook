import 'dotenv/config'
import { COMPATIBILITY_DIFF_DEFAULTS, generateCompatibilityDiff } from './diff.js'
import {
	addUrlAndPersist,
	bootstrapCompatibilityManifest,
	getRunnerOptions,
	loadSelectedManifest,
	parseRunnerArgs,
	runCompatibilitySweep,
	saveCompatibilityArtifacts
} from './runner.js'

const args = parseRunnerArgs(process.argv.slice(2))

if (args.diff) {
	const outputPath = args.output || COMPATIBILITY_DIFF_DEFAULTS.outputPath
	const diff = await generateCompatibilityDiff({ outputPath })
	console.log(`Compatibility diff written to ${outputPath}`)
	console.log(`New candidate domains: ${diff.newDomainCount}`)
	process.exit(0)
}

const options = getRunnerOptions(args)

if (options.bootstrapManifest) {
	bootstrapCompatibilityManifest({ manifestPath: options.manifestPath })
	console.log(`Compatibility manifest written to ${options.manifestPath}`)
	process.exit(0)
}

if (options.addUrl) {
	const entry = addUrlAndPersist({
		url: options.url,
		statusClass: options.statusClassForUrl,
		notes: options.notes,
		manifestPath: options.manifestPath
	})
	console.log(`Compatibility manifest updated with ${entry.url}`)
}

const manifest = loadSelectedManifest(options.manifestPath)
const payload = await runCompatibilitySweep({ manifest, options })
const finalPayload = saveCompatibilityArtifacts(payload, options)
console.log(`Compatibility results written to ${options.resultsPath}`)
console.log(`Compatibility report written to ${options.reportPath}`)
if (options.url) {
	console.log(`Processed URL: ${options.url}`)
	console.log(`Result rows written: ${finalPayload.results.filter((result) => result.url === options.url).length}`)
}
