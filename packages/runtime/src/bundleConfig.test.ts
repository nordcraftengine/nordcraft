import { describe, expect, test } from 'bun:test'
import path from 'path'
// @ts-expect-error - JS script import
import {
  NORDCRAFT_RUNTIME_DEFINES,
  PACKAGE_ROOT,
  RUNTIME_BUNDLES,
  getBuildOptions,
  getBundleOptions,
  getDefine,
  getSourceEntry,
  serveAnalyzer,
} from '../scripts/bundleConfig'

describe('bundleConfig', () => {
  describe('getBuildOptions & getBundleOptions', () => {
    test('defines RUNTIME_BUNDLES for runtime entry points', () => {
      expect(Object.keys(RUNTIME_BUNDLES)).toEqual([
        'page.main',
        'custom-element.main',
        'api-v1.main',
        'api-v2.main',
      ])
    })

    test('getBuildOptions returns standard options', () => {
      const options = getBuildOptions({
        entryPoint: 'src/page.main.ts',
        define: NORDCRAFT_RUNTIME_DEFINES.page,
      })
      expect(options.format).toBe('esm')
      expect(options.bundle).toBe(true)
      expect(options.minify).toBe(true)
      expect(options.absWorkingDir).toBe(PACKAGE_ROOT)
    })

    test('returns build options for known bundles', () => {
      const pageOptions = getBundleOptions('page.main')
      expect(pageOptions.entryPoints).toEqual(['src/page.main.ts'])
      expect(pageOptions.define).toEqual(NORDCRAFT_RUNTIME_DEFINES.page)
      expect(pageOptions.format).toBe('esm')
      expect(pageOptions.absWorkingDir).toBe(PACKAGE_ROOT)

      const ceOptions = getBundleOptions('custom-element.main')
      expect(ceOptions.entryPoints).toEqual(['src/custom-element.main.ts'])
      expect(ceOptions.define).toEqual(
        NORDCRAFT_RUNTIME_DEFINES['custom-element'],
      )
    })

    test('throws for unknown bundle names', () => {
      expect(() => getBundleOptions('unknown-bundle')).toThrow(
        'Unknown runtime bundle: unknown-bundle',
      )
    })
  })

  describe('getSourceEntry', () => {
    test('resolves known bundle names', () => {
      expect(getSourceEntry('page.main')).toBe('src/page.main.ts')
      expect(getSourceEntry('custom-element.main')).toBe(
        'src/custom-element.main.ts',
      )
      expect(getSourceEntry('api-v1.main')).toBe('src/api-v1.main.ts')
      expect(getSourceEntry('api-v2.main')).toBe('src/api-v2.main.ts')
    })

    test('resolves dist output paths with various extensions', () => {
      expect(getSourceEntry('dist/page.main.esm.js')).toBe('src/page.main.ts')
      expect(getSourceEntry('dist/page.main.esm.js.map')).toBe(
        'src/page.main.ts',
      )
      expect(getSourceEntry('page.main.esm.js')).toBe('src/page.main.ts')
    })

    test('resolves direct source paths and prefixed paths', () => {
      expect(getSourceEntry('src/page.main.ts')).toBe('src/page.main.ts')
      expect(getSourceEntry('./src/page.main.ts')).toBe('src/page.main.ts')
      expect(getSourceEntry('packages/runtime/src/page.main.ts')).toBe(
        'src/page.main.ts',
      )
      expect(
        getSourceEntry(path.resolve(PACKAGE_ROOT, 'src/page.main.ts')),
      ).toBe('src/page.main.ts')
    })

    test('returns undefined for non-existent bundles or files', () => {
      expect(getSourceEntry('does-not-exist')).toBeUndefined()
      expect(getSourceEntry('dist/unknown.esm.js')).toBeUndefined()
    })
  })

  describe('getDefine', () => {
    test('returns defines for known bundle names', () => {
      expect(getDefine('src/page.main.ts')).toEqual(
        NORDCRAFT_RUNTIME_DEFINES.page,
      )
      expect(getDefine('src/custom-element.main.ts')).toEqual(
        NORDCRAFT_RUNTIME_DEFINES['custom-element'],
      )
    })

    test('detects custom-element in entryPoint name', () => {
      expect(getDefine('src/other-custom-element.ts')).toEqual(
        NORDCRAFT_RUNTIME_DEFINES['custom-element'],
      )
    })

    test('detects preview in entryPoint name', () => {
      expect(getDefine('src/editor-preview.main.ts')).toEqual(
        NORDCRAFT_RUNTIME_DEFINES.preview,
      )
    })

    test('defaults to page define for unknown entries', () => {
      expect(getDefine('src/some-component.ts')).toEqual(
        NORDCRAFT_RUNTIME_DEFINES.page,
      )
    })
  })

  describe('serveAnalyzer', () => {
    test('serves the bundle analyzer HTML, CSS, JS, and metafile endpoint', async () => {
      const mockMetafile = {
        inputs: {},
        outputs: {},
      }
      const server = serveAnalyzer(mockMetafile)

      try {
        const htmlRes = await server.fetch('http://localhost/')
        expect(htmlRes.status).toBe(200)
        expect(htmlRes.headers.get('Content-Type')).toContain('text/html')
        const htmlText = await htmlRes.text()
        expect(htmlText).toContain('Nordcraft')
        expect(htmlText).toContain('useTreemap')

        const cssRes = await server.fetch('http://localhost/index.css')
        expect(cssRes.status).toBe(200)
        expect(cssRes.headers.get('Content-Type')).toContain('text/css')

        const jsRes = await server.fetch('http://localhost/index.js')
        expect(jsRes.status).toBe(200)
        expect(jsRes.headers.get('Content-Type')).toContain('javascript')

        const metaRes = await server.fetch('http://localhost/metafile.json')
        expect(metaRes.status).toBe(200)
        expect(metaRes.headers.get('Content-Type')).toContain(
          'application/json',
        )
        const metaJson = await metaRes.json()
        expect(metaJson).toEqual(mockMetafile)

        const notFoundRes = await server.fetch('http://localhost/unknown-path')
        expect(notFoundRes.status).toBe(404)
      } finally {
        server.stop()
      }
    })
  })
})
