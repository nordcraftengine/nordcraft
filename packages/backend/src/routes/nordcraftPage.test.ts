import * as ssrRenderingApi from '@nordcraft/ssr/rendering/api'
import * as ssrRenderingComponents from '@nordcraft/ssr/rendering/components'
import * as ssrRenderingFormulaContext from '@nordcraft/ssr/rendering/formulaContext'
import * as ssrRenderingHtml from '@nordcraft/ssr/rendering/html'
import { beforeEach, describe, expect, it, spyOn } from 'bun:test'
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

  beforeEach(() => {
    spyOn(ssrRenderingApi, 'processComponentApis').mockImplementation(
      (p: any) => p,
    )
    spyOn(ssrRenderingFormulaContext, 'getPageFormulaContext').mockReturnValue({
      formulaContext: { env: { request: { cookies: {} } } },
      data: {},
    } as any)
    spyOn(ssrRenderingHtml, 'getHtmlLanguage').mockReturnValue('en')
    spyOn(ssrRenderingHtml, 'getCharset').mockReturnValue('utf-8')
    spyOn(ssrRenderingHtml, 'getTheme').mockReturnValue('default')
    spyOn(ssrRenderingComponents, 'renderPageBody').mockResolvedValue({
      apiCache: {},
      html: '<div>Test content</div>',
      customProperties: [],
    } as any)
  })

  const renderPage = async ({
    page = mockPage,
    files = mockFiles,
  }: {
    page?: any
    files?: any
  } = {}) => {
    const app = new Hono()
    app.use('*', timing())
    app.get('/test', (c) => {
      return nordcraftPage({
        hono: c as any,
        project: mockProject,
        files,
        page,
        status: 200,
        options: mockOptions,
      })
    })
    const client: any = testClient(app)
    return client.test.$get()
  }

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

  it('does not preload API runtimes when no APIs are declared', async () => {
    const res = await renderPage()
    const html = await res.text()
    expect(html).not.toContain('/_static/api-v1.main.esm.js')
    expect(html).not.toContain('/_static/api-v2.main.esm.js')
  })

  it('preloads the API v1 runtime when a legacy API is declared', async () => {
    const res = await renderPage({
      page: {
        ...mockPage,
        apis: {
          legacy: {
            name: 'Legacy API',
            type: 'REST',
          },
        },
      },
    })
    const html = await res.text()
    expect(html).toContain('/_static/api-v1.main.esm.js')
    expect(html).not.toContain('/_static/api-v2.main.esm.js')
  })

  it('preloads the API v2 runtime when an API v2 is declared', async () => {
    const res = await renderPage({
      page: {
        ...mockPage,
        apis: {
          'API v2': {
            name: 'API v2',
            type: 'http',
            version: 2,
            inputs: {},
          },
        },
      },
    })
    const html = await res.text()
    expect(html).not.toContain('/_static/api-v1.main.esm.js')
    expect(html).toContain('/_static/api-v2.main.esm.js')
  })

  it('preloads API runtimes used by included components', async () => {
    const res = await renderPage({
      page: {
        ...mockPage,
        nodes: {
          root: {
            type: 'component',
            name: 'child-component',
          },
        },
      },
      files: {
        ...mockFiles,
        components: {
          'child-component': {
            name: 'child-component',
            apis: {
              'API v2': {
                name: 'API v2',
                type: 'http',
                version: 2,
                inputs: {},
              },
            },
            nodes: {},
          },
        },
      },
    })
    const html = await res.text()
    expect(html).toContain('/_static/api-v2.main.esm.js')
    expect(html).not.toContain('/_static/api-v1.main.esm.js')
  })
})
