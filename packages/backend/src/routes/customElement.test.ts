import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { testClient } from 'hono/testing'
import { customElement } from './customElement'

describe('customElement', () => {
  it('generates custom element script with apiVersions in defineComponents options', async () => {
    const mockFiles = {
      components: {
        'my-element': {
          name: 'my-element',
          apis: {
            'API v2': {
              name: 'API v2',
              type: 'http',
              version: 2,
              inputs: {},
            },
          },
          attributes: {},
          events: [],
          nodes: {},
        },
      },
      themes: {},
      packages: {},
    }

    const app = new Hono()
    app.use('*', async (c, next) => {
      c.set('project' as any, { name: 'test_project' } as any)
      await next()
    })
    app.get(
      '/custom-element/:filename',
      customElement(async () => mockFiles as any),
    )

    const client: any = testClient(app)
    const res = await client['custom-element'][':filename'].$get({
      param: { filename: 'my-element.js' },
    })

    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).toContain('"apiVersions":{"v1":false,"v2":true}')
  })
})
