const esbuild = require('esbuild')

// In order to serve page.main.js + custom-element.main.js as ES modules, it's useful if
// we build them as part of the runtime package. This way, we can import them from other
// packages without having to worry about the build process.
const output = esbuild.build({
  entryPoints: ['src/page.main.ts', 'src/custom-element.main.ts'],
  bundle: true,
  sourcemap: true,
  minify: true,
  write: true,
  outdir: 'dist',
  format: 'esm',
  entryNames: '[dir]/[name].esm',
  metafile: true,
})
// Write the metafile
output
  .then((result) => {
    const metafilePath = 'dist/meta.json'
    require('fs').writeFileSync(
      metafilePath,
      JSON.stringify(result.metafile, null, 2),
    )
    console.log(`Metafile written to ${metafilePath}`)
  })
  .catch((error) => {
    console.error('Build failed:', error)
    process.exit(1)
  })
