import { PAGE_STATE_SCRIPT_ID, type ToddleInternals } from '@nordcraft/core'
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

  it('serializes only per-request state in the HTML script tag and loads component structures separately', async () => {
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
          pageComponentsUrl: (name: string) => `/custom-components/${name}.js`,
        },
      })
    })
    const client: any = testClient(app)

    const res = await client.test.$get()
    const htmlText = await res.text()
    const stateMatch = htmlText.match(
      new RegExp(
        `<script type="application/json" id="${PAGE_STATE_SCRIPT_ID}">([\\s\\S]*?)</script>`,
      ),
    )
    const rawState = stateMatch?.[1] ?? ''
    const parsedState = JSON.parse(rawState) as Pick<
      ToddleInternals,
      'pageState' | 'cookies'
    >

    expect({
      status: res.status,
      hasEscapedScriptTag: rawState.includes('\\u003c/script>'),
      hasRawClosingScriptTag: rawState.includes('</script>'),
      hasRuntimePreload: htmlText.includes(
        '<link rel="modulepreload" href="/_static/page.main.esm.js" />',
      ),
      hasComponentsPreload: htmlText.includes(
        '<link rel="modulepreload" href="/custom-components/test-page.js" />',
      ),
      hasCustomCodePreload: htmlText.includes(
        '<link rel="modulepreload" href="/_static/cc_test-page.js" />',
      ),
      hasComponentsModuleScript: htmlText.includes(
        '<script type="module" src="/custom-components/test-page.js"></script>',
      ),
      parsedState,
    }).toEqual({
      status: 200,
      hasEscapedScriptTag: true,
      hasRawClosingScriptTag: false,
      hasRuntimePreload: true,
      hasComponentsPreload: true,
      hasCustomCodePreload: true,
      hasComponentsModuleScript: true,
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

  it('applies cacheBuster to stylesheet, component module, and custom code URLs', async () => {
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
      hasComponentsPreloadWithCacheBuster: htmlText.includes(
        '<link rel="modulepreload" href="/.nordcraft/components/test-page.js?v=commit-sha-1" />',
      ),
      hasCustomCodePreloadWithCacheBuster: htmlText.includes(
        '<link rel="modulepreload" href="/_static/cc_test-page.js?v=commit-sha-1" />',
      ),
      hasComponentsScriptWithCacheBuster: htmlText.includes(
        '<script type="module" src="/.nordcraft/components/test-page.js?v=commit-sha-1"></script>',
      ),
    }).toEqual({
      status: 200,
      hasResetStylesheetWithCacheBuster: true,
      hasPageStylesheetWithCacheBuster: true,
      hasComponentsPreloadWithCacheBuster: true,
      hasCustomCodePreloadWithCacheBuster: true,
      hasComponentsScriptWithCacheBuster: true,
    })
  })
})
