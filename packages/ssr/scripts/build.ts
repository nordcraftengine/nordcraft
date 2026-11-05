import esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'

const PACKAGE_ROOT = path.resolve(__dirname, '..')

const run = async () => {
  const result = await esbuild.build({
    absWorkingDir: PACKAGE_ROOT,
    entryPoints: ['src/rendering/fontLoader.ts'],
    bundle: true,
    minify: true,
    platform: 'browser',
    // Wrap in an IIFE so the inlined script executes immediately without polluting the surrounding scope
    format: 'iife',
    write: false,
  })
  const bundled = result.outputFiles[0]?.text.trim()
  if (!bundled) {
    throw new Error('esbuild produced no output for fontLoader')
  }

  const distFontsPath = path.resolve(PACKAGE_ROOT, 'dist/rendering/fonts.js')
  const content = fs.readFileSync(distFontsPath, 'utf-8')
  const target = "export const FONT_LOADER_SCRIPT = '__FONT_LOADER_SCRIPT__';"
  if (!content.includes(target)) {
    throw new Error(
      `Expected FONT_LOADER_SCRIPT placeholder not found in ${distFontsPath}`,
    )
  }
  fs.writeFileSync(
    distFontsPath,
    content.replace(
      target,
      `export const FONT_LOADER_SCRIPT = ${JSON.stringify(bundled)};`,
    ),
    'utf-8',
  )
}

run().catch(() => process.exit(1))
