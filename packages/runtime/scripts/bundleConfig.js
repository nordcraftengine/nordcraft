const path = require('path')

const PACKAGE_ROOT = path.resolve(__dirname, '..')

// Compile-time flags for dead-code elimination (see
// `packages/core/src/compileTime.ts`).
const NORDCRAFT_RUNTIME_DEFINES = {
  page: {
    IS_PREVIEW: 'false',
    IS_CUSTOM_ELEMENT: 'false',
  },
  preview: {
    IS_PREVIEW: 'true',
    IS_CUSTOM_ELEMENT: 'false',
  },
  'custom-element': {
    IS_PREVIEW: 'false',
    IS_CUSTOM_ELEMENT: 'true',
  },
}

// In order to serve page.main.js + custom-element.main.js as ES modules, it's useful if
// we build them as part of the runtime package. This way, we can import them from other
// packages without having to worry about the build process.
const RUNTIME_BUNDLES = {
  'page.main': {
    entryPoint: 'src/page.main.ts',
    define: NORDCRAFT_RUNTIME_DEFINES.page,
  },
  'custom-element.main': {
    entryPoint: 'src/custom-element.main.ts',
    define: NORDCRAFT_RUNTIME_DEFINES['custom-element'],
  },
}

const getBuildOptions = ({ entryPoint, define }) => ({
  absWorkingDir: PACKAGE_ROOT,
  entryPoints: [entryPoint],
  bundle: true,
  sourcemap: true,
  minify: true,
  write: true,
  outdir: 'dist',
  format: 'esm',
  entryNames: '[dir]/[name].esm',
  define,
})

const getBundleOptions = (name) => {
  const bundle = RUNTIME_BUNDLES[name]
  if (!bundle) {
    throw new Error(`Unknown runtime bundle: ${name}`)
  }

  return getBuildOptions(bundle)
}

module.exports = {
  NORDCRAFT_RUNTIME_DEFINES,
  PACKAGE_ROOT,
  RUNTIME_BUNDLES,
  getBuildOptions,
  getBundleOptions,
}
