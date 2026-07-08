import * as ssrRenderingApi from '@nordcraft/ssr/dist/rendering/api'
import * as ssrRenderingComponents from '@nordcraft/ssr/dist/rendering/components'
import * as ssrRenderingFormulaContext from '@nordcraft/ssr/dist/rendering/formulaContext'
import * as ssrRenderingHtml from '@nordcraft/ssr/dist/rendering/html'
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
      env: { request: { cookies: {} } },
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
})
