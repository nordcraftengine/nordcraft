const esbuild = require('esbuild')

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

Promise.all([
  esbuild.build({
    entryPoints: ['src/page.main.ts'],
    bundle: true,
    sourcemap: true,
    minify: true,
    write: true,
    outdir: 'dist',
    format: 'esm',
    entryNames: '[dir]/[name].esm',
    define: NORDCRAFT_RUNTIME_DEFINES.page,
  }),
  esbuild.build({
    entryPoints: ['src/custom-element.main.ts'],
    bundle: true,
    sourcemap: true,
    minify: true,
    write: true,
    outdir: 'dist',
    format: 'esm',
    entryNames: '[dir]/[name].esm',
    define: NORDCRAFT_RUNTIME_DEFINES['custom-element'],
  }),
]).catch(() => process.exit(1))
