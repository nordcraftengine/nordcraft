import {
  DATA_ATTR_COMPONENTS_URL,
  DATA_ATTR_CUSTOM_CODE_URL,
  PAGE_STATE_SCRIPT_ID,
  type PageStateData,
} from '@nordcraft/core'
import * as ssrRenderingApi from '@nordcraft/ssr/rendering/api'
import * as ssrRenderingComponents from '@nordcraft/ssr/rendering/components'
import * as ssrRenderingFormulaContext from '@nordcraft/ssr/rendering/formulaContext'
import * as ssrRenderingHtml from '@nordcraft/ssr/rendering/html'
import { afterAll, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { Hono } from 'hono'
import { testClient } from 'hono/testing'
import { timing } from 'hono/timing'
import { nordcraftPage } from './nordcraftPage'

describe('nordcraftPage', () => {
  const mockProject = {
    short_id: 'test_project',
  } as any

  const mockFiles = {
    components: {},
    packages: {},
    themes: {},
    config: {
      theme: 'default',
    },
  } as any

  const mockPage = {
    name: 'test-page',
    route: {
      path: [],
      query: {},
      response: {
        headers: {
          'Cache-Control': 'public, max-age=30',
          'X-Custom-Header': 'CustomValue',
        },
      },
    },
  } as any

  const mockOptions = {
    pageStylesheetUrl: (name: string) => `/_static/${name}.css`,
    customCodeUrl: (name: string) => `/_static/cc_${name}.js`,
  } as any

  let spies: Array<{ mockRestore: () => void }> = []

  beforeEach(() => {
    spies = [
      spyOn(ssrRenderingApi, 'processComponentApis').mockImplementation(
        (p: any) => p,
      ),
      spyOn(
        ssrRenderingFormulaContext,
        'getPageFormulaContext',
      ).mockReturnValue({
        formulaContext: { env: { request: { cookies: {} } } },
        data: {},
      } as any),
      spyOn(ssrRenderingHtml, 'getHtmlLanguage').mockReturnValue('en'),
      spyOn(ssrRenderingHtml, 'getCharset').mockReturnValue('utf-8'),
      spyOn(ssrRenderingHtml, 'getTheme').mockReturnValue('default'),
      spyOn(ssrRenderingComponents, 'renderPageBody').mockResolvedValue({
        apiCache: {},
        html: '<div>Test content</div>',
        customProperties: [],
      } as any),
    ]
  })

  afterAll(() => {
    spies.forEach((spy) => spy.mockRestore())
  })

  it('should set response headers correctly', async () => {
    const app = new Hono()
    app.use('*', timing())
    app.get('/test', (c) => {
      return nordcraftPage({
        hono: c as any,
        project: mockProject,
        files: mockFiles,
        page: mockPage,
        status: 200,
        options: mockOptions,
      })
    })
    const client: any = testClient(app)

    const res = await client.test.$get()
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=30')
    expect(res.headers.get('X-Custom-Header')).toBe('CustomValue')
    expect(res.headers.get('Content-Type')).toContain('text/html')
  })

  it('serializes only per-request state in the HTML script tag and loads component JSON separately', async () => {
    spies.push(
      spyOn(
        ssrRenderingFormulaContext,
        'getPageFormulaContext',
      ).mockReturnValue({
        formulaContext: {
          env: { request: { cookies: { session: 'abc' } } },
        },
        data: {
          Variables: { count: 2 },
        },
      } as any),
      spyOn(ssrRenderingComponents, 'renderPageBody').mockResolvedValue({
        apiCache: {
          myApi: {
            data: { message: '</script><script>alert(1)</script>' },
            error: null,
            isLoading: false,
          },
        },
        html: '<div>Test content</div>',
        customProperties: [],
      } as any),
    )

    const app = new Hono()
    app.use('*', timing())
    app.get('/test', (c) => {
      return nordcraftPage({
        hono: c as any,
        project: mockProject,
        files: { ...mockFiles, customCode: true },
        page: mockPage,
        status: 200,
        options: {
          ...mockOptions,
          pageComponentsUrl: (name: string) =>
            `/custom-components/${name}.json`,
        },
      })
    })
    const client: any = testClient(app)

    const res = await client.test.$get()
    const htmlText = await res.text()
    const headMatch = htmlText.match(/<head>([\s\S]*?)<\/head>/)
    const bodyMatch = htmlText.match(/<body>([\s\S]*?)<\/body>/)
    const headHtml = headMatch?.[1] ?? ''
    const bodyHtml = bodyMatch?.[1] ?? ''
    const stateMatch = bodyHtml.match(
      new RegExp(
        `<script type="application/json" id="${PAGE_STATE_SCRIPT_ID}" ${DATA_ATTR_COMPONENTS_URL}="([^"]*)" ${DATA_ATTR_CUSTOM_CODE_URL}="([^"]*)">([\\s\\S]*?)</script>`,
      ),
    )
    const componentsUrlAttr = stateMatch?.[1] ?? ''
    const customCodeUrlAttr = stateMatch?.[2] ?? ''
    const rawState = stateMatch?.[3] ?? ''
    const parsedState = JSON.parse(rawState) as PageStateData
    const appIndex = bodyHtml.indexOf('<div id="App">')
    const stateScriptIndex = bodyHtml.indexOf(`id="${PAGE_STATE_SCRIPT_ID}"`)
    const runtimeScriptIndex = bodyHtml.indexOf(
      '<script type="module" src="/_static/page.main.esm.js"></script>',
    )

    expect({
      status: res.status,
      componentsUrlAttr,
      customCodeUrlAttr,
      hasEscapedScriptTag: rawState.includes('\\u003c/script>'),
      hasRawClosingScriptTag: rawState.includes('</script>'),
      hasComponentsPreloadInHead: headHtml.includes(
        '<link rel="preload" as="fetch" crossorigin="anonymous" href="/custom-components/test-page.json" />',
      ),
      hasRuntimePreloadInHead: headHtml.includes(
        '<link rel="modulepreload" href="/_static/page.main.esm.js" />',
      ),
      hasCustomCodePreloadInHead: headHtml.includes(
        '<link rel="modulepreload" href="/_static/cc_test-page.js" />',
      ),
      hasStateScriptInHead: headHtml.includes(`id="${PAGE_STATE_SCRIPT_ID}"`),
      hasRuntimeScriptInHead: headHtml.includes(
        '<script type="module" src="/_static/page.main.esm.js"></script>',
      ),
      scriptsAfterAppInBody:
        appIndex !== -1 &&
        stateScriptIndex > appIndex &&
        runtimeScriptIndex > stateScriptIndex,
      parsedState,
    }).toEqual({
      status: 200,
      componentsUrlAttr: '/custom-components/test-page.json',
      customCodeUrlAttr: '/_static/cc_test-page.js',
      hasEscapedScriptTag: true,
      hasRawClosingScriptTag: false,
      hasComponentsPreloadInHead: true,
      hasRuntimePreloadInHead: true,
      hasCustomCodePreloadInHead: true,
      hasStateScriptInHead: false,
      hasRuntimeScriptInHead: false,
      scriptsAfterAppInBody: true,
      parsedState: {
        pageState: {
          Variables: { count: 2 },
          Apis: {
            myApi: {
              data: { message: '</script><script>alert(1)</script>' },
              error: null,
              isLoading: false,
            },
          },
        },
        cookies: ['session'],
      },
    })
  })

  it('streams the HTML head and body before the serialized state script', async () => {
    const app = new Hono()
    app.use('*', timing())
    app.get('/test', (c) => {
      return nordcraftPage({
        hono: c as any,
        project: mockProject,
        files: mockFiles,
        page: mockPage,
        status: 200,
        options: mockOptions,
      })
    })
    const client: any = testClient(app)

    const res = await client.test.$get()
    const reader = res.body?.getReader()
    expect(reader !== undefined).toBe(true)

    const decoder = new TextDecoder()
    const chunks: string[] = []
    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        chunks.push(decoder.decode(value, { stream: true }))
      }
    }

    expect({
      chunkCount: chunks.length,
      firstChunkHasHeadAndApp:
        chunks[0]?.includes('<head>') &&
        chunks[0]?.includes('<div id="App"><div>Test content</div></div>'),
      firstChunkHasStateScript: chunks[0]?.includes(
        `id="${PAGE_STATE_SCRIPT_ID}"`,
      ),
      lastChunkHasStateScript: chunks[chunks.length - 1]?.includes(
        `id="${PAGE_STATE_SCRIPT_ID}"`,
      ),
    }).toEqual({
      chunkCount: 2,
      firstChunkHasHeadAndApp: true,
      firstChunkHasStateScript: false,
      lastChunkHasStateScript: true,
    })
  })

  it('applies cacheBuster to stylesheet, component JSON, and custom code URLs', async () => {
    const app = new Hono()
    app.use('*', timing())
    app.get('/test', (c) => {
      return nordcraftPage({
        hono: c as any,
        project: mockProject,
        files: { ...mockFiles, customCode: true },
        page: mockPage,
        status: 200,
        options: mockOptions,
        cacheBuster: 'commit-sha-1',
      })
    })
    const client: any = testClient(app)

    const res = await client.test.$get()
    const htmlText = await res.text()

    expect({
      status: res.status,
      hasResetStylesheetWithCacheBuster: htmlText.includes(
        'href="/_static/reset.css?v=commit-sha-1"',
      ),
      hasPageStylesheetWithCacheBuster: htmlText.includes(
        'href="/_static/test-page.css?v=commit-sha-1"',
      ),
      hasStateComponentsAttrWithCacheBuster: htmlText.includes(
        `${DATA_ATTR_COMPONENTS_URL}="/_static/components_test-page.json?v=commit-sha-1"`,
      ),
      hasStateCustomCodeAttrWithCacheBuster: htmlText.includes(
        `${DATA_ATTR_CUSTOM_CODE_URL}="/_static/cc_test-page.js?v=commit-sha-1"`,
      ),
      hasComponentsPreloadWithCacheBuster: htmlText.includes(
        '<link rel="preload" as="fetch" crossorigin="anonymous" href="/_static/components_test-page.json?v=commit-sha-1" />',
      ),
      hasCustomCodePreloadWithCacheBuster: htmlText.includes(
        '<link rel="modulepreload" href="/_static/cc_test-page.js?v=commit-sha-1" />',
      ),
      hasRuntimeScript: htmlText.includes(
        '<script type="module" src="/_static/page.main.esm.js"></script>',
      ),
    }).toEqual({
      status: 200,
      hasResetStylesheetWithCacheBuster: true,
      hasPageStylesheetWithCacheBuster: true,
      hasStateComponentsAttrWithCacheBuster: true,
      hasStateCustomCodeAttrWithCacheBuster: true,
      hasComponentsPreloadWithCacheBuster: true,
      hasCustomCodePreloadWithCacheBuster: true,
      hasRuntimeScript: true,
    })
  })
})
