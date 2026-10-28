const esbuild = require('esbuild')
const {
  PACKAGE_ROOT,
  RUNTIME_BUNDLES,
  getBuildOptions,
  getDefine,
  getSourceEntry,
} = require('./bundleConfig')

const DEFAULT_BUNDLE = 'page.main'

const HELP = `Usage: bun run analyze [bundle] [--verbose]

Analyze the size of a runtime bundle built with esbuild.

Arguments:
  bundle          Bundle to analyze (default: ${DEFAULT_BUNDLE}).
                  Both bundle names and output files are accepted, e.g.
                  "page.main", "dist/page.main.esm.js" or "src/page.main.ts".
                  Available bundles: ${Object.keys(RUNTIME_BUNDLES).join(', ')}
                  Any other source entry point or esbuild output file can be
                  analyzed as well.

Options:
  -v, --verbose   Show the size of each individual file
  -h, --help      Show this help message`

const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP)
  process.exit(0)
}

const verbose = args.includes('--verbose') || args.includes('-v')
const requested = args.find((arg) => !arg.startsWith('-')) ?? DEFAULT_BUNDLE
const entryPoint = getSourceEntry(requested)

if (!entryPoint) {
  console.error(`Could not find a runtime bundle matching "${requested}".`)
  console.error(`Available bundles: ${Object.keys(RUNTIME_BUNDLES).join(', ')}`)
  process.exit(1)
}

const analyze = async () => {
  const result = await esbuild.build({
    ...getBuildOptions({ entryPoint, define: getDefine(entryPoint) }),
    // Analyze the build without overwriting the existing output.
    write: false,
    metafile: true,
  })
  const report = await esbuild.analyzeMetafile(result.metafile, { verbose })
  console.log(report)
}

analyze().catch((error) => {
  console.error(error)
  process.exit(1)
})
