import type { ToddleInternals } from '@nordcraft/core'
import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { getConnInfo } from 'hono/bun'
import { getApp } from '../app'
import {
  cachePageState,
  createCloudflarePageStateStore,
  createPageStateHandler,
  type PageStateEntry,
  type PageStateStore,
} from './pageState'

describe('pageState', () => {
  const sampleState: ToddleInternals = {
    project: 'test_project',
    branch: 'main',
    commit: 'abc123',
    pageState: {
      Apis: {},
      Attributes: {},
      Location: {
        page: 'HomePage',
        path: '/',
        params: {},
        query: {},
        hash: '',
      },
    },
    component: {
      name: 'HomePage',
      nodes: {},
      apis: {},
      variables: {},
      workflows: {},
    },
    components: [],
    isPageLoaded: false,
    cookies: [],
  }

  it('uses an injected PageStateStore through getApp for caching and serving page state', async () => {
    const stored = new Map<
      string,
      { entry: PageStateEntry; ttlSeconds: number }
    >()
    const customStore: PageStateStore = {
      get: (key) => stored.get(key)?.entry,
      set: ({ key, entry, ttlSeconds }) => {
        stored.set(key, { entry, ttlSeconds })
      },
    }

    const app = getApp({
      getConnInfo,
      fileLoaders: [],
      pageLoader: {
        loader: () => undefined,
        urls: {
          pageStylesheetUrl: (name) => `/_static/${name}.css`,
          customCodeUrl: (name) => `/_static/cc_${name}.js`,
        },
      },
      pageStateStore: customStore,
    })

    const subApp = new Hono()
    let generatedUrls:
      | { pageStateUrl: string; customCodeUrl?: string }
      | undefined
    subApp.get('/write', async (c) => {
      generatedUrls = await cachePageState({
        state: sampleState,
        ctx: c as never,
        pageName: 'HomePage',
        usesCustomCode: false,
        options: {
          pageStylesheetUrl: (name) => `/_static/${name}.css`,
          customCodeUrl: (name) => `/_static/cc_${name}.js`,
        },
        store: customStore,
        cacheControl: 'public, max-age=60',
      })
      return c.text('ok')
    })

    await subApp.request('http://localhost/write')
    if (!generatedUrls) {
      throw new Error('Expected cachePageState to return pageStateUrl')
    }

    const res = await app.request(
      `http://localhost${generatedUrls.pageStateUrl}`,
    )
    const body = await res.text()

    expect({
      status: res.status,
      contentType: res.headers.get('content-type'),
      cacheControl: res.headers.get('cache-control'),
      storedCount: stored.size,
      containsProject: body.includes('"project":"test_project"'),
    }).toEqual({
      status: 200,
      contentType: 'application/javascript',
      cacheControl: 'public, max-age=60',
      storedCount: 1,
      containsProject: true,
    })
  })

  it('returns 500 from pageStateHandler when state is not found in the store', async () => {
    const emptyStore: PageStateStore = {
      get: () => undefined,
      set: () => {},
    }
    const app = new Hono()
    app.get(
      '/.nordcraft/page-state/:renderId{.+.js}',
      createPageStateHandler(emptyStore),
    )

    const res = await app.request(
      'http://localhost/.nordcraft/page-state/missing.js',
    )
    expect(res.status).toBe(500)
  })

  describe('createCloudflarePageStateStore', () => {
    it('writes to caches.open("page-state") and schedules KV write via waitUntil, reading from cache first', async () => {
      const cacheEntries = new Map<string, Response>()
      const kvEntries = new Map<
        string,
        { value: string; metadata?: { cacheControl?: string }; ttl?: number }
      >()
      const waitUntilPromises: Promise<unknown>[] = []
      let kvGetCount = 0

      const originalCaches = globalThis.caches
      Object.defineProperty(globalThis, 'caches', {
        value: {
          open: async (name: string) => {
            expect(name).toBe('page-state')
            return {
              match: async (key: string) => cacheEntries.get(key)?.clone(),
              put: async (key: string, response: Response) => {
                cacheEntries.set(key, response.clone())
              },
            }
          },
        },
        configurable: true,
      })

      try {
        const store = createCloudflarePageStateStore()
        const ctx = {
          env: {
            PAGE_STATE: {
              put: async (
                key: string,
                value: string,
                options?: {
                  expirationTtl?: number
                  metadata?: { cacheControl?: string }
                },
              ) => {
                kvEntries.set(key, {
                  value,
                  metadata: options?.metadata,
                  ttl: options?.expirationTtl,
                })
              },
              getWithMetadata: async (key: string) => {
                kvGetCount++
                const entry = kvEntries.get(key)
                return {
                  value: entry?.value ?? null,
                  metadata: entry?.metadata ?? null,
                }
              },
            },
          },
          executionCtx: {
            waitUntil: (p: Promise<unknown>) => {
              waitUntilPromises.push(p)
            },
          },
        } as never

        await store.set(
          {
            key: 'https://example.com/.nordcraft/page-state/abc.js',
            entry: {
              body: 'console.info(1)',
              cacheControl: 'public, max-age=30',
            },
            ttlSeconds: 36000,
          },
          ctx,
        )
        await Promise.all(waitUntilPromises)

        const hit = await store.get(
          'https://example.com/.nordcraft/page-state/abc.js',
          ctx,
        )

        // Simulate cross-PoP L1 miss
        cacheEntries.clear()
        const kvFallbackHit = await store.get(
          'https://example.com/.nordcraft/page-state/abc.js',
          ctx,
        )
        await Promise.all(waitUntilPromises)

        expect({
          hit,
          kvFallbackHit,
          kvGetCount,
          kvStored: kvEntries.get(
            'https://example.com/.nordcraft/page-state/abc.js',
          ),
          repopulatedCacheHasKey: cacheEntries.has(
            'https://example.com/.nordcraft/page-state/abc.js',
          ),
        }).toEqual({
          hit: {
            body: 'console.info(1)',
            cacheControl: 'public, max-age=30',
          },
          kvFallbackHit: {
            body: 'console.info(1)',
            cacheControl: 'public, max-age=30',
          },
          kvGetCount: 1,
          kvStored: {
            value: 'console.info(1)',
            metadata: { cacheControl: 'public, max-age=30' },
            ttl: 36000,
          },
          repopulatedCacheHasKey: true,
        })
      } finally {
        Object.defineProperty(globalThis, 'caches', {
          value: originalCaches,
          configurable: true,
        })
      }
    })
  })
})
