import { build } from 'esbuild'
import * as fs from 'fs'

const bundleFiles = (files: any, settings: any) =>
  build({
    entryPoints: files,
    bundle: true,
    sourcemap: true,
    minify: true,
    write: false,
    outdir: 'dist',
    ...settings,
  })

/**
 * Creates a temporary dist/ folder
 */
const setup = () => {
  fs.rmSync('dist/', { recursive: true, force: true })
  fs.mkdirSync('dist/', { recursive: true })
}

const run = async () => {
  const t1 = Date.now()

  setup()

  const scriptModuleFiles = await bundleFiles(
    ['../css-parser/src/cssParser.browser.ts'],
    { format: 'esm' },
  )

  scriptModuleFiles.outputFiles?.forEach((file) => {
    const path = file.path.split('/')
    const fileName = path[path.length - 1]
    fs.writeFileSync(`dist/${fileName}`, file.text)
  })

  return `Build finished in ${Date.now() - t1}ms`
}

run().then(console.log, console.error)
