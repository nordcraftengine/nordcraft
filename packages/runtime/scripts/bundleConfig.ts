import { exec } from 'child_process'
import type { BuildOptions, Metafile } from 'esbuild'
import fs from 'fs'
import path from 'path'

export const PACKAGE_ROOT = path.resolve(__dirname, '..')

// Compile-time flags for dead-code elimination (see
// `packages/core/src/compileTime.ts`).
export const NORDCRAFT_RUNTIME_DEFINES = {
  page: {
    IS_PREVIEW: 'false',
    IS_CUSTOM_ELEMENT: 'false',
    IS_PAGE: 'true',
  },
  preview: {
    IS_PREVIEW: 'true',
    IS_CUSTOM_ELEMENT: 'false',
    IS_PAGE: 'false',
  },
  'custom-element': {
    IS_PREVIEW: 'false',
    IS_CUSTOM_ELEMENT: 'true',
    IS_PAGE: 'false',
  },
} satisfies Record<string, Record<string, string>>

// In order to serve page.main.js + custom-element.main.js as ES modules, it's useful if
// we build them as part of the runtime package. This way, we can import them from other
// packages without having to worry about the build process.
export const RUNTIME_BUNDLES: Record<
  string,
  { entryPoint: string; define: Record<string, string> }
> = {
  'page.main': {
    entryPoint: 'src/page.main.ts',
    define: NORDCRAFT_RUNTIME_DEFINES.page,
  },
  'custom-element.main': {
    entryPoint: 'src/custom-element.main.ts',
    define: NORDCRAFT_RUNTIME_DEFINES['custom-element'],
  },
}

export const getBuildOptions = ({
  entryPoint,
  define,
}: {
  entryPoint: string
  define: Record<string, string>
}): BuildOptions => ({
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

export const getBundleOptions = (name: string) => {
  const bundle = RUNTIME_BUNDLES[name]
  if (!bundle) {
    throw new Error(`Unknown runtime bundle: ${name}`)
  }

  return getBuildOptions(bundle)
}

// Resolve a bundle name, an esbuild output file or a source entry point to the
// source file that should be bundled for analysis.
export const getSourceEntry = (value: string, root = PACKAGE_ROOT) => {
  let relativePath = path.isAbsolute(value) ? path.relative(root, value) : value

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
    fs.existsSync(path.resolve(root, candidate)),
  )
}

export const getDefine = (entryPoint: string) => {
  const name = path.basename(entryPoint).replace(/\.tsx?$/, '')
  if (RUNTIME_BUNDLES[name]) {
    return RUNTIME_BUNDLES[name].define
  }
  if (name.includes('custom-element')) {
    return NORDCRAFT_RUNTIME_DEFINES['custom-element']
  }
  return name.includes('preview')
    ? NORDCRAFT_RUNTIME_DEFINES.preview
    : NORDCRAFT_RUNTIME_DEFINES.page
}

export const serveAnalyzer = (
  metafile: Metafile,
  options: { port?: number } = {},
) => {
  const analyzerDir = path.resolve(__dirname, 'analyzer')
  const html = fs.readFileSync(path.join(analyzerDir, 'index.html'), 'utf8')
  const css = fs.readFileSync(path.join(analyzerDir, 'index.css'), 'utf8')
  const js = fs.readFileSync(path.join(analyzerDir, 'index.js'), 'utf8')

  return Bun.serve({
    port: options.port ?? (process.env.PORT ? Number(process.env.PORT) : 0),
    fetch(req) {
      const url = new URL(req.url)
      if (url.pathname === '/' || url.pathname === '/index.html') {
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      }
      if (url.pathname === '/index.css') {
        return new Response(css, {
          headers: { 'Content-Type': 'text/css; charset=utf-8' },
        })
      }
      if (url.pathname === '/index.js') {
        return new Response(js, {
          headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
        })
      }
      if (url.pathname === '/metafile.json') {
        return new Response(JSON.stringify(metafile), {
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      }
      return new Response('Not found', { status: 404 })
    },
  })
}

export const openBrowser = (url: string) => {
  const cmd =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open'
  exec(`${cmd} ${url}`)
}
