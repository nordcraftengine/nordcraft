const esbuild = require('esbuild')

// In order to serve page.main.js + custom-element.main.js as ES modules, it's useful if
// we build them as part of the runtime package. This way, we can import them from other
// packages without having to worry about the build process.
esbuild.build({
  entryPoints: ['src/page.main.ts', 'src/custom-element.main.ts'],
  bundle: true,
  sourcemap: true,
  minify: true,
  write: true,
  outdir: 'dist',
  format: 'esm',
  entryNames: '[dir]/[name].esm',
})
