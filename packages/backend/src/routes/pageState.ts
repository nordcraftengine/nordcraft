import type { ToddleInternals } from '@nordcraft/core'
import type { Context, ExecutionContext, Handler } from 'hono'
import { nanoid } from 'nanoid'
import type { HonoEnv } from '../../hono'
import type { PageLoaderUrls } from '../loaders/types'
import { InMemoryCache } from '../utils/cache'

const PAGE_STATE_TTL_SECONDS = 60 * 60 * 10 // 10 hours
const PAGE_STATE_CACHE_NAME = 'page-state'
// Keep lowercase to match Response.headers lookup
const CACHE_TRANSFER_HEADER_KEY = 'x-nordcraft-cache-transfer'

type MaybePromise<T> = T | Promise<T>

export interface PageStateEntry {
  body: string
  cacheControl?: string
}

export interface PageStateStore {
  get: (
    key: string,
    ctx: Context<HonoEnv<any>>,
  ) => MaybePromise<PageStateEntry | undefined>
  set: (
    args: { key: string; entry: PageStateEntry; ttlSeconds: number },
    ctx: Context<HonoEnv<any>>,
  ) => MaybePromise<void>
}

export const createInMemoryPageStateStore = (): PageStateStore => {
  const cache = new InMemoryCache<PageStateEntry>({
    ttlSeconds: PAGE_STATE_TTL_SECONDS,
    swrSeconds: PAGE_STATE_TTL_SECONDS,
  })
  return {
    get: (key) => cache.get(key)?.value,
    set: ({ key, entry }) => {
      cache.set(key, entry)
    },
  }
}

const getExecutionCtx = (
  ctx: Context<HonoEnv<any>>,
): ExecutionContext | undefined => {
  try {
    return ctx.executionCtx
  } catch {
    return undefined
  }
}

const toCacheResponse = (entry: PageStateEntry, ttlSeconds: number) => {
  const headers = new Headers({
    'Cache-Control': `s-maxage=${ttlSeconds}`,
    'Content-Type': 'application/javascript',
  })
  if (entry.cacheControl) {
    headers.set(CACHE_TRANSFER_HEADER_KEY, entry.cacheControl)
  }
  return new Response(entry.body, { headers })
}

export const createCloudflarePageStateStore = (): PageStateStore => ({
  get: async (key, ctx) => {
    const hasNamedCaches =
      typeof caches !== 'undefined' && typeof caches.open === 'function'
    if (hasNamedCaches) {
      const cache = await caches.open(PAGE_STATE_CACHE_NAME)
      const cached = await cache.match(key)
      if (cached) {
        return {
          body: await cached.text(),
          cacheControl:
            cached.headers.get(CACHE_TRANSFER_HEADER_KEY) ?? undefined,
        }
      }
    }

    const kv = ctx.env?.PAGE_STATE
    if (!kv) {
      return undefined
    }
    const { value, metadata } = await kv.getWithMetadata<{
      cacheControl?: string
    }>(key)
    if (typeof value !== 'string') {
      return undefined
    }
    const entry: PageStateEntry = {
      body: value,
      cacheControl: metadata?.cacheControl,
    }
    if (hasNamedCaches) {
      const backfill = caches
        .open(PAGE_STATE_CACHE_NAME)
        .then((cache) =>
          cache.put(key, toCacheResponse(entry, PAGE_STATE_TTL_SECONDS)),
        )
      const executionCtx = getExecutionCtx(ctx)
      if (executionCtx) {
        executionCtx.waitUntil(backfill)
      } else {
        await backfill
      }
    }
    return entry
  },
  set: async ({ key, entry, ttlSeconds }, ctx) => {
    if (typeof caches !== 'undefined' && typeof caches.open === 'function') {
      const cache = await caches.open(PAGE_STATE_CACHE_NAME)
      await cache.put(key, toCacheResponse(entry, ttlSeconds))
    }

    const kv = ctx.env?.PAGE_STATE
    if (kv) {
      const kvWrite = kv.put(key, entry.body, {
        expirationTtl: ttlSeconds,
        metadata: entry.cacheControl
          ? { cacheControl: entry.cacheControl }
          : undefined,
      })
      const executionCtx = getExecutionCtx(ctx)
      if (executionCtx) {
        executionCtx.waitUntil(kvWrite)
      } else {
        await kvWrite
      }
    }
  },
})

const defaultPageStateStore = createInMemoryPageStateStore()

export const createPageStateHandler =
  (
    store: PageStateStore = defaultPageStateStore,
  ): Handler<HonoEnv, '/.nordcraft/page-state/:renderId{.+.js}'> =>
  async (c) => {
    c.header('Content-Type', 'application/javascript')
    const timestamp = c.req.query('t')
    const cacheUrl = pageStateCacheUrl({
      renderId: c.req.param('renderId'),
      timestamp: timestamp ? parseInt(timestamp) : undefined,
    })
    const cacheKey = pageStateCacheKey({
      ctx: c,
      cacheUrl,
    })

    const pageState = await store.get(cacheKey.url, c)
    if (!pageState) {
      // eslint-disable-next-line no-console
      console.error(`Page state not found for key: ${cacheKey.url}`)
      return c.body(null, { status: 500 })
    }
    c.header('Cache-Control', pageState.cacheControl ?? 'no-cache')
    return c.body(pageState.body)
  }

export const pageStateHandler = createPageStateHandler()

export const pageStateCacheKey = ({
  ctx,
  cacheUrl,
}: {
  ctx: Context<HonoEnv<any>>
  cacheUrl: string
}) => {
  const url = new URL(ctx.req.url)
  return new Request(`${url.origin}${cacheUrl}`)
}

export const pageStateCacheUrl = ({
  renderId,
  timestamp,
}: {
  renderId: string
  timestamp?: number
}) =>
  `/.nordcraft/page-state/${renderId.endsWith('.js') ? renderId : `${renderId}.js`}${timestamp ? `?t=${timestamp}` : ''}`

export const cachePageState = async ({
  state,
  ctx,
  pageName,
  usesCustomCode,
  options,
  store = defaultPageStateStore,
  cacheControl,
}: {
  state: ToddleInternals
  ctx: Context<HonoEnv<any>>
  pageName: string
  usesCustomCode: boolean
  options: PageLoaderUrls
  store?: PageStateStore
  cacheControl?: string
}) => {
  const renderId = nanoid(10)
  const timestamp = Date.now()
  const pageStateUrl = pageStateCacheUrl({ renderId, timestamp })
  const cacheKey = pageStateCacheKey({ ctx, cacheUrl: pageStateUrl })
  const customCodeUrl = usesCustomCode
    ? options.customCodeUrl(pageName)
    : undefined
  const js = `\
// This file is auto-generated by nordcraft. Do not edit directly.
import { initGlobalObject, createRoot } from '/_static/page.main.esm.js';
${
  usesCustomCode
    ? `import { loadCustomCode, formulas, actions } from '${customCodeUrl}';`
    : `\
const formulas = {};
const actions = {};`
}
window.__toddle = ${JSON.stringify(state)};
window.__toddle.components = [window.__toddle.component, ...window.__toddle.components];
initGlobalObject({formulas, actions});
${usesCustomCode ? 'loadCustomCode();' : ''}
createRoot(document.getElementById("App"));
  `

  // Store the cached data for 10 hours, which is long enough for the page to load
  // and request the page state, and also long enough for crawlers to visit after its scheduled
  await store.set(
    {
      key: cacheKey.url,
      entry: { body: js, cacheControl },
      ttlSeconds: PAGE_STATE_TTL_SECONDS,
    },
    ctx,
  )
  return { pageStateUrl, customCodeUrl }
}
