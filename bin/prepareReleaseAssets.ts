/* eslint-disable no-console */
import { RESET_STYLES } from '@nordcraft/core/dist/styling/theme.const'
import type { BuildOptions } from 'esbuild'
import { build } from 'esbuild'
import { mkdirSync, rmSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { combineElements } from '../packages/editor/elements/combineElements'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const resolvePath = (...segments: string[]) =>
  path.resolve(__dirname, ...segments)

const distPath = '../dist'
const distDir = resolvePath(distPath)

const bundleFiles = (
  files: BuildOptions['entryPoints'],
  settings?: BuildOptions,
) =>
  build({
    entryPoints: files,
    bundle: true,
    sourcemap: true,
    minify: true,
    write: true,
    outdir: 'dist',
    allowOverwrite: true,
    entryNames: `[name]${settings?.format === 'esm' ? '.esm' : ''}`,
    ...settings,
  })

const setup = () => {
  rmSync(distDir, { recursive: true, force: true })
  mkdirSync(distDir, { recursive: true })
}

const createTempFileFromValue = (filename, value) => {
  const path = resolvePath(distPath, filename)
  writeFileSync(path, value)
  return path
}

const run = async () => {
  const t1 = Date.now()

  setup()

  await bundleFiles([
    'packages/runtime/src/custom-components/components.ts',
    'packages/search/src/problems.worker.ts',
    'packages/search/src/search.worker.ts',
  ])

  await bundleFiles(
    [
      'packages/runtime/src/page.main.ts',
      'packages/runtime/src/editor-preview.main.ts',
      'packages/runtime/src/custom-element.main.ts',
      'packages/core/src/component/ToddleComponent.ts',
      'packages/core/src/formula/ToddleFormula.ts',
      'packages/core/src/api/api.ts',
    ],
    { format: 'esm' },
  )

  await bundleFiles([createTempFileFromValue('reset.css', RESET_STYLES)])

  // Build the backend worker
  await build({
    entryPoints: ['packages/backend/src/index.ts'],
    bundle: true,
    sourcemap: true,
    minify: true,
    write: true,
    outfile: 'dist/backend.js',
    platform: 'node',
    format: 'esm',
    allowOverwrite: true,
    entryNames: `[name].esm`,
  })

  // Build html elements for the editor
  createTempFileFromValue(
    'elements.json',
    JSON.stringify(combineElements(), null, 2),
  )

  return `Build finished in ${Date.now() - t1}ms`
}

run().then(console.log, console.error)
