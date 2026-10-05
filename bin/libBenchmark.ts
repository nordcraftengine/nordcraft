import { createInterface } from 'node:readline'

import { isDeepStrictEqual as isEqual } from 'node:util'
import {
  getBoolean,
  getNonNegativeInteger,
  getOptionalString,
  getPositiveInteger,
  parseBenchmarkArgs,
} from '../benchmarks/cli'
import {
  isLibBenchmarkCaseId,
  libBenchmarkUsage,
  type LibBenchmarkCaseId,
} from '../benchmarks/libCases'
import { median } from '../benchmarks/stats'
import * as libFormulas from '../packages/lib/dist/formulas.js'

type BenchmarkRunner = () => void | Promise<void>

type WorkerRequest = { type: 'close' } | { type: 'run'; count?: number }

type WorkerResponse = { timeMs: number } | { error: string }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isWorkerRequest = (value: unknown): value is WorkerRequest => {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false
  }
  if (value.type === 'close') {
    return !('count' in value)
  }
  return (
    value.type === 'run' &&
    (value.count === undefined ||
      (typeof value.count === 'number' &&
        Number.isInteger(value.count) &&
        value.count >= 1))
  )
}

type LibArgs = {
  caseId: LibBenchmarkCaseId
  repeat: number
  isWorker: boolean
  runs: number
  warmup: number
  outputPath?: string
  json: boolean
}

export const parseLibArgs = (
  argv: readonly string[] = Bun.argv.slice(2),
): LibArgs => {
  const args = parseBenchmarkArgs(argv)
  const caseId = args.get('--case')
  if (!isLibBenchmarkCaseId(caseId)) {
    throw new Error(`Usage: bun bin/libBenchmark.ts ${libBenchmarkUsage()}`)
  }

  return {
    caseId,
    repeat: getPositiveInteger(args, '--repeat', 1),
    isWorker: getBoolean(args, '--worker', false),
    runs: getPositiveInteger(args, '--runs', 1),
    warmup: getNonNegativeInteger(args, '--warmup', 0),
    outputPath: getOptionalString(args, '--output'),
    json: getBoolean(args, '--json', false),
  }
}

// Ensure deep-equal is available for equals/notEqual/includes/indexOf paths,
// mirroring how the runtime installs it on globalThis.
if (
  !(globalThis as Record<string, unknown>).toddle ||
  typeof (globalThis as any).toddle?.isEqual !== 'function'
) {
  ;(globalThis as any).toddle = { isEqual }
}

const ensureBrowserStubs = () => {
  const g = globalThis as Record<string, any>
  if (typeof g.window === 'undefined') {
    const store = new Map<string, string>()
    store.set(
      'nc:cart',
      JSON.stringify({
        items: [{ id: 'sku-1', qty: 2, price: 299 }],
        currency: 'DKK',
      }),
    )
    store.set('nc:theme', JSON.stringify('dark'))
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, String(value))
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => store.clear(),
      get length() {
        return store.size
      },
      key: (index: number) => [...store.keys()][index] ?? null,
    }
    g.window = {
      localStorage: storage,
      sessionStorage: storage,
      location: { href: 'https://shop.nordcraft.com/products?page=2' },
      navigator: {
        languages: ['en-US', 'en', 'da'],
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    }
    g.localStorage = storage
    g.sessionStorage = storage
  }
  if (typeof g.navigator === 'undefined') {
    g.navigator = {
      languages: ['en-US', 'en', 'da'],
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      canShare: () => true,
      share: async () => undefined,
      clipboard: { writeText: async () => undefined },
    }
  } else {
    if (typeof g.navigator.canShare !== 'function') {
      g.navigator.canShare = () => true
    }
    if (!Array.isArray(g.navigator.languages)) {
      g.navigator.languages = ['en-US', 'en', 'da']
    }
    if (typeof g.navigator.userAgent !== 'string') {
      g.navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  }
}

ensureBrowserStubs()

// Shared realistic fixtures. Kept at module scope so every worker
// reuses the same data shapes across base/head comparisons.
const NUMBERS_1K = Array.from({ length: 1000 }, (_, i) => (i * 37.7) % 1000)
const PRICES_1K = Array.from(
  { length: 1000 },
  (_, i) => Math.round(((i * 19.99) % 9999) * 100) / 100,
)
const TITLES_1K = Array.from(
  { length: 1000 },
  (_, i) => `Nordcraft Heavy Tee ${i} – Washed Blue (Size M)`,
)
const PADDED_TITLES = TITLES_1K.map((t) => `   ${t}  \n`)
const IDS_1K_WITH_DUPES = Array.from(
  { length: 1000 },
  (_, i) => `sku-${i % 400}`,
)
const CATEGORIES = ['apparel', 'accessories', 'footwear', 'home'] as const

type Product = {
  id: string
  title: string
  price: number
  compareAtPrice: number | null
  category: (typeof CATEGORIES)[number]
  rating: number
  inStock: boolean
  onSale: boolean
  tags: string[]
  variants: Array<{ sku: string; size: string; stock: number }>
}

const PRODUCTS_500: Product[] = Array.from({ length: 500 }, (_, i) => ({
  id: `sku-${i}`,
  title: `Nordcraft Heavy Tee ${i} – Washed Blue`,
  price: Math.round((((i * 37.5) % 900) + 99) * 100) / 100,
  compareAtPrice:
    i % 4 === 0 ? Math.round((((i * 41) % 1200) + 200) * 100) / 100 : null,
  category: CATEGORIES[i % CATEGORIES.length]!,
  rating: (i % 50) / 10,
  inStock: i % 7 !== 0,
  onSale: i % 4 === 0,
  tags: i % 2 === 0 ? ['new', 'bestseller'] : ['restock'],
  variants: [
    { sku: `sku-${i}-s`, size: 'S', stock: (i * 3) % 20 },
    { sku: `sku-${i}-m`, size: 'M', stock: (i * 5) % 20 },
  ],
}))

const PRODUCT_SAMPLE = PRODUCTS_500[0]!
const NESTED_STORE = {
  store: {
    currency: 'DKK',
    products: PRODUCTS_500,
    meta: { page: 2, perPage: 50, total: 500, query: 'tee' },
  },
}
const OBJECT_100: Record<string, unknown> = Object.fromEntries(
  Array.from({ length: 100 }, (_, i) => [`field_${i}`, `value-${i}`]),
)
const ENTRIES_100 = Object.entries(OBJECT_100).map(([key, value]) => ({
  key,
  value,
}))
const NESTED_ROWS_500 = Array.from({ length: 500 }, (_, i) => [
  i,
  i + 1,
  [PRODUCTS_500[i % PRODUCTS_500.length]!.id],
])
const CSV_TEXT = `id,title,price\n${PRODUCTS_500.map((p) => `${p.id},"${p.title}",${p.price}`).join('\n')}`
const PARAGRAPH = Array.from(
  { length: 40 },
  (_, i) =>
    `Row ${i}: The Nordcraft Heavy Tee is cut from 220gsm organic cotton and garment-dyed for a soft, lived-in feel.`,
).join('\n')
const TEMPLATE = `Hello {{ name }}, your order {{ orderId }} ({{ items }} items) ships to {{ city }} on {{ date }}.`
const URL_LIST = PRODUCTS_500.slice(0, 100).map(
  (p) =>
    `https://shop.nordcraft.com/products/${p.id}?color=blue&size=M#details`,
)
const ENCODED_URLS = URL_LIST.map((u) => encodeURIComponent(u))
const JSON_PRODUCT = JSON.stringify({
  ...PRODUCT_SAMPLE,
  createdAt: new Date('2024-05-01T12:00:00.000Z'),
})
const ASCII_TITLES = Array.from(
  { length: 1000 },
  (_, i) => `Nordcraft Heavy Tee ${i} - Washed Blue (Size M)`,
)
const BASE64_PAYLOADS = ASCII_TITLES.slice(0, 200).map((t) =>
  Buffer.from(t, 'utf8').toString('base64'),
)
const ISO_DATES = Array.from(
  { length: 200 },
  (_, i) =>
    `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}T12:00:00.000Z`,
)
const EPOCH_DATES = ISO_DATES.map((s) => Date.parse(s))
const DATE_OBJECTS = ISO_DATES.map((s) => new Date(s))
const REGEX_LINES = TITLES_1K.map((t) => `${t} – in stock, ships in 24h`)
const ELEMENT_INDEX = new Map(
  Array.from({ length: 200 }, (_, i) => [`node-${i}`, { id: `node-${i}` }]),
)

const SERVER_CTX = {
  component: {},
  data: {},
  root: {
    getElementById: (id: string) => ELEMENT_INDEX.get(id) ?? null,
    cookie: 'session=abc123; nc-theme=dark; cart=3-items',
  },
  env: {
    branchName: 'main',
    isServer: true as const,
    request: {
      headers: {
        'accept-language': 'en-US,en;q=0.9,da;q=0.8',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      cookies: { session: 'abc123', 'nc-theme': 'dark', cart: '3-items' },
      url: 'https://shop.nordcraft.com/products?category=apparel&page=2#details',
    },
    logErrors: false,
  },
} as any

const getHandler = (id: string): ((args: unknown[], ctx: any) => unknown) => {
  const mod = (libFormulas as Record<string, any>)[id]
  if (!mod) {
    throw new Error(`Unknown lib formula: ${id}`)
  }
  const fn = mod.default ?? mod.handler
  if (typeof fn !== 'function') {
    throw new Error(`Lib formula ${id} has no handler function`)
  }
  return fn
}

export const createRunner = async (
  id: LibBenchmarkCaseId,
): Promise<BenchmarkRunner> => {
  const run = getHandler(id)
  switch (id) {
    case 'Id':
      return () => {
        for (let i = 0; i < 2000; i++) run([], SERVER_CTX)
      }
    case 'absolute':
      return () => {
        for (let i = 0; i < NUMBERS_1K.length; i++)
          run([NUMBERS_1K[i]! - 500], SERVER_CTX)
      }
    case 'add':
      return () => {
        for (let i = 0; i < 1000; i++)
          run(
            [i % 100, (i + 1) % 100, (i + 2) % 100, 19.99, 4.5, 1, 2, 3],
            SERVER_CTX,
          )
      }
    case 'append':
      return () => {
        for (let i = 0; i < 200; i++)
          run([PRODUCTS_500, PRODUCTS_500[i % PRODUCTS_500.length]], SERVER_CTX)
      }
    case 'boolean':
      return () => {
        const samples: unknown[] = [0, 1, '', 'tee', null, [], {}, false, true]
        for (let i = 0; i < 2000; i++)
          run([samples[i % samples.length]], SERVER_CTX)
      }
    case 'branchName':
      return () => {
        for (let i = 0; i < 5000; i++) run([], SERVER_CTX)
      }
    case 'canShare':
      return () => {
        for (let i = 0; i < 2000; i++)
          run(
            ['https://shop.nordcraft.com/products/sku-1', 'Nordcraft', 'Look!'],
            SERVER_CTX,
          )
      }
    case 'capitalize':
      return () => {
        for (let i = 0; i < TITLES_1K.length; i++)
          run([TITLES_1K[i % TITLES_1K.length]!.toLowerCase()], SERVER_CTX)
      }
    case 'clamp':
      return () => {
        for (let i = 0; i < NUMBERS_1K.length; i++)
          run([NUMBERS_1K[i], 0, 100], SERVER_CTX)
      }
    case 'concatenate':
      return () => {
        for (let i = 0; i < 300; i++) {
          run(
            [PRODUCTS_500.slice(0, 50), PRODUCTS_500.slice(50, 100)],
            SERVER_CTX,
          )
          run([{ a: 1, b: 2 }, { c: 3 }], SERVER_CTX)
          run(['Nordcraft ', 'Heavy ', `Tee ${i}`], SERVER_CTX)
        }
      }
    case 'currentURL':
      return () => {
        for (let i = 0; i < 5000; i++) run([], SERVER_CTX)
      }
    case 'dateFromString':
      return () => {
        for (let i = 0; i < ISO_DATES.length; i++)
          run([ISO_DATES[i % ISO_DATES.length]], SERVER_CTX)
      }
    case 'dateFromTimestamp':
      return () => {
        for (let i = 0; i < EPOCH_DATES.length; i++)
          run([EPOCH_DATES[i % EPOCH_DATES.length]], SERVER_CTX)
      }
    case 'decodeBase64':
      return () => {
        for (let i = 0; i < BASE64_PAYLOADS.length; i++)
          run([BASE64_PAYLOADS[i % BASE64_PAYLOADS.length]], SERVER_CTX)
      }
    case 'decodeURIComponent':
      return () => {
        for (let i = 0; i < ENCODED_URLS.length; i++)
          run([ENCODED_URLS[i % ENCODED_URLS.length]], SERVER_CTX)
      }
    case 'defaultTo':
      return () => {
        for (let i = 0; i < 2000; i++)
          run([null, '', 0, false, `fallback-${i}`], SERVER_CTX)
      }
    case 'deleteKey':
      return () => {
        for (let i = 0; i < 200; i++)
          run([NESTED_STORE, ['store', 'meta', 'query']], SERVER_CTX)
      }
    case 'divide':
      return () => {
        for (let i = 0; i < 1000; i++)
          run([(i + 100) * 1.5, (i % 9) + 1], SERVER_CTX)
      }
    case 'drop':
      return () => {
        for (let i = 0; i < 300; i++) {
          run([PRODUCTS_500, 10], SERVER_CTX)
          run([TITLES_1K[0], 5], SERVER_CTX)
        }
      }
    case 'dropLast':
      return () => {
        for (let i = 0; i < 300; i++) {
          run([PRODUCTS_500, 10], SERVER_CTX)
          run([TITLES_1K[0], 5], SERVER_CTX)
        }
      }
    case 'encodeBase64':
      return () => {
        for (let i = 0; i < 500; i++)
          run([ASCII_TITLES[i % ASCII_TITLES.length]], SERVER_CTX)
      }
    case 'encodeJSON':
      return () => {
        for (let i = 0; i < 200; i++) run([PRODUCT_SAMPLE, 2], SERVER_CTX)
      }
    case 'encodeURIComponent':
      return () => {
        for (let i = 0; i < URL_LIST.length; i++)
          run([URL_LIST[i % URL_LIST.length]], SERVER_CTX)
      }
    case 'entries':
      return () => {
        for (let i = 0; i < 300; i++) run([OBJECT_100], SERVER_CTX)
      }
    case 'equals':
      return () => {
        for (let i = 0; i < 300; i++)
          run(
            [
              PRODUCTS_500[i % PRODUCTS_500.length],
              PRODUCTS_500[i % PRODUCTS_500.length],
            ],
            SERVER_CTX,
          )
      }
    case 'every':
      return () => {
        const pred = ({ item }: any) => (item as Product).price > 0
        for (let i = 0; i < 100; i++) run([PRODUCTS_500, pred], SERVER_CTX)
      }
    case 'filter':
      return () => {
        const pred = ({ item }: any) => (item as Product).price > 300
        for (let i = 0; i < 50; i++) run([PRODUCTS_500, pred], SERVER_CTX)
      }
    case 'find':
      return () => {
        const pred = ({ item }: any) => (item as Product).id === 'sku-250'
        for (let i = 0; i < 100; i++) run([PRODUCTS_500, pred], SERVER_CTX)
      }
    case 'findIndex':
      return () => {
        const pred = ({ item }: any) => (item as Product).id === 'sku-250'
        for (let i = 0; i < 100; i++) run([PRODUCTS_500, pred], SERVER_CTX)
      }
    case 'findLast':
      return () => {
        const pred = ({ item }: any) => (item as Product).category === 'home'
        for (let i = 0; i < 100; i++) run([PRODUCTS_500, pred], SERVER_CTX)
      }
    case 'first':
      return () => {
        for (let i = 0; i < 2000; i++) {
          run([PRODUCTS_500], SERVER_CTX)
          run([TITLES_1K[i % TITLES_1K.length]], SERVER_CTX)
        }
      }
    case 'flatten':
      return () => {
        for (let i = 0; i < 100; i++) run([NESTED_ROWS_500], SERVER_CTX)
      }
    case 'formatDate':
      return () => {
        const opts = {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'Europe/Copenhagen',
        }
        for (let i = 0; i < 100; i++)
          run(
            [DATE_OBJECTS[i % DATE_OBJECTS.length], 'en-US', opts],
            SERVER_CTX,
          )
      }
    case 'formatNumber':
      return () => {
        for (let i = 0; i < 200; i++) {
          run(
            [
              PRICES_1K[i % PRICES_1K.length],
              'en-US',
              { style: 'currency', currency: 'DKK' },
            ],
            SERVER_CTX,
          )
          run([1240000 + i, 'en-US', { notation: 'compact' }], SERVER_CTX)
        }
      }
    case 'fromEntries':
      return () => {
        for (let i = 0; i < 300; i++) run([ENTRIES_100], SERVER_CTX)
      }
    case 'get':
      return () => {
        for (let i = 0; i < 1000; i++)
          run(
            [NESTED_STORE, ['store', 'products', i % 500, 'price']],
            SERVER_CTX,
          )
      }
    case 'getCookie':
      return () => {
        for (let i = 0; i < 2000; i++) run(['session'], SERVER_CTX)
      }
    case 'getElementById':
      return () => {
        for (let i = 0; i < 1000; i++) run([[`node-${i % 200}`][0]], SERVER_CTX)
      }
    case 'getFromLocalStorage':
      return () => {
        for (let i = 0; i < 1000; i++) run(['nc:cart'], SERVER_CTX)
      }
    case 'getFromSessionStorage':
      return () => {
        for (let i = 0; i < 1000; i++) run(['nc:cart'], SERVER_CTX)
      }
    case 'getHttpOnlyCookie':
      return () => {
        for (let i = 0; i < 2000; i++) run(['session'], SERVER_CTX)
      }
    case 'greaterOrEqueal':
      return () => {
        for (let i = 0; i < 2000; i++)
          run([NUMBERS_1K[i % 1000], NUMBERS_1K[(i + 7) % 1000]], SERVER_CTX)
      }
    case 'greaterThan':
      return () => {
        for (let i = 0; i < 2000; i++)
          run([NUMBERS_1K[i % 1000], NUMBERS_1K[(i + 7) % 1000]], SERVER_CTX)
      }
    case 'groupBy':
      return () => {
        const fn = ({ item }: any) => (item as Product).category
        for (let i = 0; i < 50; i++) run([PRODUCTS_500, fn], SERVER_CTX)
      }
    case 'includes':
      return () => {
        for (let i = 0; i < 200; i++) {
          run([PRODUCTS_500, PRODUCTS_500[250]], SERVER_CTX)
          run([TITLES_1K[0], 'Heavy Tee'], SERVER_CTX)
        }
      }
    case 'indexOf':
      return () => {
        for (let i = 0; i < 200; i++) {
          run([PRODUCTS_500, PRODUCTS_500[250]], SERVER_CTX)
          run([TITLES_1K[0], 'Heavy'], SERVER_CTX)
        }
      }
    case 'isServer':
      return () => {
        for (let i = 0; i < 5000; i++) run([], SERVER_CTX)
      }
    case 'join':
      return () => {
        const titles = PRODUCTS_500.map((p) => p.title)
        for (let i = 0; i < 100; i++) run([titles, ', '], SERVER_CTX)
      }
    case 'json':
      return () => {
        for (let i = 0; i < 200; i++) run([PRODUCT_SAMPLE, 2], SERVER_CTX)
      }
    case 'keyBy':
      return () => {
        const fn = ({ item }: any) => (item as Product).id
        for (let i = 0; i < 50; i++) run([PRODUCTS_500, fn], SERVER_CTX)
      }
    case 'languages':
      return () => {
        for (let i = 0; i < 2000; i++) run([], SERVER_CTX)
      }
    case 'last':
      return () => {
        for (let i = 0; i < 2000; i++) {
          run([PRODUCTS_500], SERVER_CTX)
          run([TITLES_1K[i % TITLES_1K.length]], SERVER_CTX)
        }
      }
    case 'lastIndexOf':
      return () => {
        for (let i = 0; i < 200; i++) {
          run([IDS_1K_WITH_DUPES, 'sku-10'], SERVER_CTX)
          run([TITLES_1K[0], 'Tee'], SERVER_CTX)
        }
      }
    case 'lessOrEqual':
      return () => {
        for (let i = 0; i < 2000; i++)
          run([NUMBERS_1K[i % 1000], NUMBERS_1K[(i + 7) % 1000]], SERVER_CTX)
      }
    case 'lessThan':
      return () => {
        for (let i = 0; i < 2000; i++)
          run([NUMBERS_1K[i % 1000], NUMBERS_1K[(i + 7) % 1000]], SERVER_CTX)
      }
    case 'logarithm':
      return () => {
        for (let i = 0; i < 1000; i++)
          run([(NUMBERS_1K[i % 1000]! % 999) + 1], SERVER_CTX)
      }
    case 'lowercase':
      return () => {
        for (let i = 0; i < TITLES_1K.length; i++)
          run([TITLES_1K[i % TITLES_1K.length]], SERVER_CTX)
      }
    case 'map':
      return () => {
        const fn = ({ item }: any) => (item as Product).price * 1.25
        for (let i = 0; i < 50; i++) run([PRODUCTS_500, fn], SERVER_CTX)
      }
    case 'matches':
      return () => {
        for (let i = 0; i < 200; i++)
          run(
            [
              REGEX_LINES[i % REGEX_LINES.length],
              'Heavy Tee \\d+',
              true,
              false,
              false,
            ],
            SERVER_CTX,
          )
      }
    case 'max':
      return () => {
        for (let i = 0; i < 1000; i++)
          run(
            [i % 100, (i + 3) % 100, (i + 7) % 100, 42, 19.99, 7, 88, 3],
            SERVER_CTX,
          )
      }
    case 'min':
      return () => {
        for (let i = 0; i < 1000; i++)
          run(
            [i % 100, (i + 3) % 100, (i + 7) % 100, 42, 19.99, 7, 88, 3],
            SERVER_CTX,
          )
      }
    case 'minus':
      return () => {
        for (let i = 0; i < 1000; i++)
          run([(i + 500) * 1.25, (i % 50) * 0.99], SERVER_CTX)
      }
    case 'modulo':
      return () => {
        for (let i = 0; i < 1000; i++) run([1000 + i, 7], SERVER_CTX)
      }
    case 'multiply':
      return () => {
        for (let i = 0; i < 1000; i++)
          run([1.5, 2, (i % 10) + 1, 1.1, 3, 2, 1, 1.01], SERVER_CTX)
      }
    case 'not':
      return () => {
        const samples: unknown[] = [0, 1, '', 'x', null, [], {}, true, false]
        for (let i = 0; i < 2000; i++)
          run([samples[i % samples.length]], SERVER_CTX)
      }
    case 'notEqual':
      return () => {
        for (let i = 0; i < 300; i++)
          run(
            [
              PRODUCTS_500[i % PRODUCTS_500.length],
              PRODUCTS_500[(i + 1) % PRODUCTS_500.length],
            ],
            SERVER_CTX,
          )
      }
    case 'now':
      return () => {
        for (let i = 0; i < 1000; i++) run([], SERVER_CTX)
      }
    case 'number':
      return () => {
        const samples = ['42', '19.99', '0x10', '', '  123  ', 'not-a-number']
        for (let i = 0; i < 2000; i++)
          run([[samples[i % samples.length]][0]], SERVER_CTX)
      }
    case 'parseJSON':
      return () => {
        for (let i = 0; i < 200; i++) run([JSON_PRODUCT, true], SERVER_CTX)
      }
    case 'parseURL':
      return () => {
        for (let i = 0; i < 200; i++)
          run([URL_LIST[i % URL_LIST.length]], SERVER_CTX)
      }
    case 'power':
      return () => {
        for (let i = 0; i < 1000; i++) run([(i % 20) + 1, 2.5], SERVER_CTX)
      }
    case 'prepend':
      return () => {
        for (let i = 0; i < 200; i++)
          run([PRODUCTS_500, PRODUCTS_500[i % PRODUCTS_500.length]], SERVER_CTX)
      }
    case 'randomNumber':
      return () => {
        for (let i = 0; i < 2000; i++) run([], SERVER_CTX)
      }
    case 'range':
      return () => {
        for (let i = 0; i < 100; i++) run([1, 500], SERVER_CTX)
      }
    case 'reduce':
      return () => {
        const fn = ({ result, item }: any) => result + (item as Product).price
        for (let i = 0; i < 50; i++) run([PRODUCTS_500, fn, 0], SERVER_CTX)
      }
    case 'replaceAll':
      return () => {
        for (let i = 0; i < 300; i++)
          run([TEMPLATE, '{{ name }}', `Customer ${i}`], SERVER_CTX)
      }
    case 'reverse':
      return () => {
        for (let i = 0; i < 100; i++) run([PRODUCTS_500], SERVER_CTX)
      }
    case 'round':
      return () => {
        for (let i = 0; i < PRICES_1K.length; i++)
          run([PRICES_1K[i % PRICES_1K.length], 2], SERVER_CTX)
      }
    case 'roundDown':
      return () => {
        for (let i = 0; i < PRICES_1K.length; i++)
          run([PRICES_1K[i % PRICES_1K.length], 2], SERVER_CTX)
      }
    case 'roundUp':
      return () => {
        for (let i = 0; i < PRICES_1K.length; i++)
          run([PRICES_1K[i % PRICES_1K.length], 2], SERVER_CTX)
      }
    case 'set':
      return () => {
        for (let i = 0; i < 200; i++)
          run([PRODUCT_SAMPLE, ['price'], 199.99 + (i % 10)], SERVER_CTX)
      }
    case 'shuffle':
      return () => {
        for (let i = 0; i < 50; i++) run([PRODUCTS_500], SERVER_CTX)
      }
    case 'size':
      return () => {
        for (let i = 0; i < 1000; i++) {
          run([PRODUCTS_500], SERVER_CTX)
          run([OBJECT_100], SERVER_CTX)
          run([TITLES_1K[i % TITLES_1K.length]], SERVER_CTX)
        }
      }
    case 'some':
      return () => {
        const pred = ({ item }: any) => (item as Product).onSale
        for (let i = 0; i < 100; i++) run([PRODUCTS_500, pred], SERVER_CTX)
      }
    case 'sort_by':
      return () => {
        const fn = ({ item }: any) => (item as Product).price
        for (let i = 0; i < 20; i++) run([PRODUCTS_500, fn, true], SERVER_CTX)
      }
    case 'split':
      return () => {
        for (let i = 0; i < 200; i++) {
          run([CSV_TEXT.slice(0, 5000), '\n'], SERVER_CTX)
          run([PARAGRAPH.slice(0, 2000), ' '], SERVER_CTX)
        }
      }
    case 'squareRoot':
      return () => {
        for (let i = 0; i < 1000; i++)
          run([(NUMBERS_1K[i % 1000]! % 999) + 1], SERVER_CTX)
      }
    case 'startsWith':
      return () => {
        for (let i = 0; i < 1000; i++)
          run(
            [URL_LIST[i % URL_LIST.length], 'https://shop.nordcraft.com'],
            SERVER_CTX,
          )
      }
    case 'string':
      return () => {
        const samples: unknown[] = [
          42,
          19.99,
          true,
          null,
          PRODUCT_SAMPLE.id,
          { v: 1 },
        ]
        for (let i = 0; i < 2000; i++)
          run([[samples[i % samples.length]][0]], SERVER_CTX)
      }
    case 'sum':
      return () => {
        const chunk = NUMBERS_1K.slice(0, 500)
        for (let i = 0; i < 100; i++) run([chunk], SERVER_CTX)
      }
    case 'take':
      return () => {
        for (let i = 0; i < 300; i++) {
          run([PRODUCTS_500, 50], SERVER_CTX)
          run([TITLES_1K[0], 20], SERVER_CTX)
        }
      }
    case 'takeLast':
      return () => {
        for (let i = 0; i < 300; i++) {
          run([PRODUCTS_500, 50], SERVER_CTX)
          run([TITLES_1K[0], 20], SERVER_CTX)
        }
      }
    case 'timestamp':
      return () => {
        for (let i = 0; i < DATE_OBJECTS.length; i++)
          run([DATE_OBJECTS[i % DATE_OBJECTS.length]], SERVER_CTX)
      }
    case 'trim':
      return () => {
        for (let i = 0; i < PADDED_TITLES.length; i++)
          run([PADDED_TITLES[i % PADDED_TITLES.length]], SERVER_CTX)
      }
    case 'typeOf':
      return () => {
        const samples: unknown[] = [
          42,
          'tee',
          true,
          [],
          {},
          null,
          undefined,
          3.14,
        ]
        for (let i = 0; i < 2000; i++)
          run([[samples[i % samples.length]][0]], SERVER_CTX)
      }
    case 'unique':
      return () => {
        for (let i = 0; i < 50; i++) run([IDS_1K_WITH_DUPES], SERVER_CTX)
      }
    case 'uppercase':
      return () => {
        for (let i = 0; i < TITLES_1K.length; i++)
          run([TITLES_1K[i % TITLES_1K.length]], SERVER_CTX)
      }
    case 'userAgent':
      return () => {
        for (let i = 0; i < 2000; i++) run([], SERVER_CTX)
      }
    default:
      throw new Error(`Missing lib benchmark runner for case: ${id}`)
  }
}

const collectGarbage = () => {
  if (typeof Bun !== 'undefined' && typeof Bun.gc === 'function') {
    Bun.gc(true)
  }
}

const measure = async (runner: BenchmarkRunner, repeat: number, count = 1) => {
  collectGarbage()
  const start = performance.now()
  for (let i = 0; i < count * repeat; i++) {
    await runner()
  }
  return (performance.now() - start) / (count * repeat)
}

const writeWorkerResponse = (response: WorkerResponse) => {
  process.stdout.write(`${JSON.stringify(response)}\n`)
}

const runWorker = async (runner: BenchmarkRunner, repeat: number) => {
  const input = createInterface({ input: process.stdin })

  for await (const line of input) {
    if (!line.trim()) {
      continue
    }

    let request: unknown
    try {
      request = JSON.parse(line) as unknown
    } catch (error) {
      writeWorkerResponse({
        error: error instanceof Error ? error.message : String(error),
      })
      continue
    }

    if (!isWorkerRequest(request)) {
      writeWorkerResponse({ error: 'Invalid worker request' })
      continue
    }

    if (request.type === 'close') {
      break
    }

    if (request.type !== 'run') {
      writeWorkerResponse({ error: `Unknown worker command: ${request.type}` })
      continue
    }

    try {
      const count = request.count ?? 1
      if (!Number.isInteger(count) || count < 1) {
        throw new Error('Worker run count must be a positive integer')
      }
      writeWorkerResponse({ timeMs: await measure(runner, repeat, count) })
    } catch (error) {
      writeWorkerResponse({
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

const runDirect = async (runner: BenchmarkRunner, options: LibArgs) => {
  for (let i = 0; i < options.warmup; i++) {
    await measure(runner, options.repeat)
  }

  const timesMs: number[] = []
  for (let i = 0; i < options.runs; i++) {
    timesMs.push(await measure(runner, options.repeat))
  }
  const result = {
    caseId: options.caseId,
    repeat: options.repeat,
    timesMs,
  }

  if (options.outputPath) {
    await Bun.write(options.outputPath, `${JSON.stringify(result, null, 2)}\n`)
  } else if (options.json) {
    process.stdout.write(`${JSON.stringify(result)}\n`)
  } else {
    const med = median(timesMs)
    process.stdout.write(`[${options.caseId}] median: ${med.toFixed(2)} ms\n`)
  }
}

export const main = async (argv: readonly string[] = Bun.argv.slice(2)) => {
  const options = parseLibArgs(argv)
  const runner = await createRunner(options.caseId)
  if (options.isWorker) {
    await runWorker(runner, options.repeat)
  } else {
    await runDirect(runner, options)
  }
}

if (import.meta.main) {
  await main()
}

// Re-export for tests without triggering side effects twice.
export const __testUtils = { getHandler, SERVER_CTX }
