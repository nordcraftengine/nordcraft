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
  let renderPageBodySpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    renderPageBodySpy = spyOn(
      ssrRenderingComponents,
      'renderPageBody',
    ).mockResolvedValue({
      apiCache: {},
      html: '<div>Test content</div>',
      customProperties: [],
    } as any)
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
      renderPageBodySpy,
    ]
  })

  afterAll(() => {
    spies.forEach((spy) => spy.mockRestore())
  })

  it('should set response headers correctly and pass project.short_id to renderPageBody', async () => {
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
    expect({
      cacheControl: res.headers.get('Cache-Control'),
      customHeader: res.headers.get('X-Custom-Header'),
      contentType: res.headers.get('Content-Type'),
      projectId: (
        renderPageBodySpy.mock.calls[0]?.[0] as { projectId?: string }
      )?.projectId,
    }).toEqual({
      cacheControl: 'public, max-age=30',
      customHeader: 'CustomValue',
      contentType: 'text/html; charset=utf-8',
      projectId: 'test_project',
    })
  })
})
