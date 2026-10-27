const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')
const {
  NORDCRAFT_RUNTIME_DEFINES,
  PACKAGE_ROOT,
  RUNTIME_BUNDLES,
  getBuildOptions,
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

// Resolve a bundle name, an esbuild output file or a source entry point to the
// source file that should be bundled for analysis.
const getSourceEntry = (value) => {
  let relativePath = path.isAbsolute(value)
    ? path.relative(PACKAGE_ROOT, value)
    : value

  relativePath = relativePath.replace(/^\.\//, '')
  if (relativePath.startsWith('packages/runtime/')) {
    relativePath = relativePath.slice('packages/runtime/'.length)
  }
  if (relativePath.startsWith('dist/')) {
    relativePath = relativePath.slice('dist/'.length)
  }

  // Output files have an optional .esm suffix, a .js extension and optionally a
  // source map extension, e.g. dist/page.main.esm.js.map.
  relativePath = relativePath
    .replace(/\.map$/, '')
    .replace(/\.esm$/, '')
    .replace(/\.(esm\.)?js$/, '')
    .replace(/\.(ts|tsx)$/, '')

  const sourceBase = relativePath.startsWith('src/')
    ? relativePath
    : `src/${relativePath}`

  return [`${sourceBase}.ts`, `${sourceBase}.tsx`].find((candidate) =>
    fs.existsSync(path.resolve(PACKAGE_ROOT, candidate)),
  )
}

const getDefine = (entryPoint) => {
  const name = path.basename(entryPoint).replace(/\.tsx?$/, '')
  if (RUNTIME_BUNDLES[name]) {
    return RUNTIME_BUNDLES[name].define
  }
  return name.includes('preview')
    ? NORDCRAFT_RUNTIME_DEFINES.preview
    : NORDCRAFT_RUNTIME_DEFINES.page
}

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
