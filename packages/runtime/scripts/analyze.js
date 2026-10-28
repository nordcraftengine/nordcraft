const esbuild = require('esbuild')
const {
  PACKAGE_ROOT,
  RUNTIME_BUNDLES,
  getBuildOptions,
  getDefine,
  getSourceEntry,
  openBrowser,
  serveAnalyzer,
} = require('./bundleConfig')

const DEFAULT_BUNDLE = 'page.main'

const HELP = `Usage: bun run analyze [bundle] [--verbose] [--open]

Analyze the size of a runtime bundle built with esbuild.

Arguments:
  bundle          Bundle to analyze (default: ${DEFAULT_BUNDLE}).
                  Both bundle names and output files are accepted, e.g.
                  "page.main", "dist/page.main.esm.js" or "src/page.main.ts".
                  Available bundles: ${Object.keys(RUNTIME_BUNDLES).join(', ')}
                  Any other source entry point or esbuild output file can be
                  analyzed as well.

Options:
  -o, --open      Open the interactive visual analyzer in your browser
  -v, --verbose   Show the size of each individual file
  -h, --help      Show this help message`

const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP)
  process.exit(0)
}

const verbose = args.includes('--verbose') || args.includes('-v')
const open = args.includes('--open') || args.includes('-o')
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

  if (open) {
    const server = serveAnalyzer(result.metafile)
    const url = `http://localhost:${server.port}`
    console.log(`Serving bundle analyzer at ${url}`)
    console.log('Press Ctrl+C to stop.')
    openBrowser(url)
  }
}

analyze().catch((error) => {
  console.error(error)
  process.exit(1)
})
