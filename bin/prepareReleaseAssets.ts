/* eslint-disable no-console */
import type { BuildOptions } from 'esbuild'
import { build } from 'esbuild'
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { RESET_STYLES } from '../packages/core/src/styling/theme.const'
import { combineElements } from '../packages/editor/elements/combineElements'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const resolvePath = (...segments: string[]) =>
  path.resolve(__dirname, ...segments)

const distPath = '../dist'
const distDir = resolvePath(distPath)

// Compile-time flags for dead-code elimination (see `packages/core/src/compileTime.ts`).
// TODO: We can also consider adding an `IS_SERVER` flag and make a server-specific bundle, but gains are likely <kb.
const NORDCRAFT_RUNTIME_DEFINES: Record<string, Record<string, string>> = {
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

const bundleFiles = (files: string[], settings?: BuildOptions) =>
  build({
    entryPoints: files.map((file) => resolvePath('../', file)),
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

const createTempFileFromValue = (filename: string, value: string) => {
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
      'packages/core/src/component/ToddleComponent.ts',
      'packages/core/src/formula/ToddleFormula.ts',
      'packages/core/src/api/api.ts',
    ],
    { format: 'esm' },
  )

  // Each browser runtime is bundled separately with its own `define` values
  // so dead-code elimination can strip preview-only code from the page and
  // custom-element bundles (the preview bundle keeps it).
  await bundleFiles(['packages/runtime/src/page.main.ts'], {
    format: 'esm',
    define: NORDCRAFT_RUNTIME_DEFINES.page,
  })

  await bundleFiles(['packages/runtime/src/editor-preview.main.ts'], {
    format: 'esm',
    define: NORDCRAFT_RUNTIME_DEFINES.preview,
  })

  await bundleFiles(['packages/runtime/src/custom-element.main.ts'], {
    format: 'esm',
    define: NORDCRAFT_RUNTIME_DEFINES['custom-element'],
  })

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

  // Build the preview backend worker
  await build({
    entryPoints: ['packages/backend/src/preview.index.ts'],
    bundle: true,
    sourcemap: true,
    minify: true,
    write: true,
    outfile: 'dist/preview.backend.js',
    platform: 'node',
    format: 'esm',
    allowOverwrite: true,
    entryNames: `[name].esm`,
  })

  // Add HTML interfaces file
  copyFileSync(
    resolvePath('../packages/editor/elements/interfaces/interfaces.json'),
    resolvePath(distPath, 'interfaces.json'),
  )

  // Build html elements for the editor
  createTempFileFromValue(
    'elements.json',
    JSON.stringify(combineElements(), null, 2),
  )

  // Copy CSS property -> keywords for the editor
  copyFileSync(
    resolvePath('../packages/editor/css-properties/cssPropertyKeywords.json'),
    resolvePath(distPath, 'css-property-keywords.json'),
  )

  return `Build finished in ${Date.now() - t1}ms`
}

run().then(console.log, console.error)
