/* eslint-disable no-console */
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

import { GlobalRegistrator } from '@happy-dom/global-registrator'

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
import {
  ARTICLE_BODY,
  BASE64_TITLES,
  BENCHMARK_ORIGIN,
  BENCHMARK_URL,
  CART,
  COLLECTION_URLS,
  COLLECTIONS,
  COOKIE_VALUES,
  CSV_ROWS,
  DESCRIPTIONS,
  DIMENSIONS,
  ENCODED_QUERIES,
  FORM_FIELD_IDS,
  ISO_DATES,
  JSON_PRODUCTS,
  LOCAL_STORAGE_VALUES,
  MIXED_VALUES,
  NESTED_TAGS,
  ORDER_TOTALS,
  ORDERS,
  PADDED_TITLES,
  PRICES,
  PRODUCT_BY_ID,
  PRODUCT_COPIES,
  PRODUCT_DATES,
  PRODUCT_LABELS,
  PRODUCT_TIMESTAMPS,
  PRODUCTS,
  RATINGS,
  SESSION_STORAGE_KEYS,
  SESSION_STORAGE_VALUES,
  SKUS,
  STORAGE_KEYS,
  TAG_LISTS,
  TAGS_WITH_DUPLICATES,
  TITLES,
  USERS,
  type Product,
} from '../benchmarks/libFixtures'
import { median } from '../benchmarks/stats'
import type {
  ActionHandler,
  FormulaHandler,
  ToddleEnv,
} from '../packages/core/dist/types'
import * as libActions from '../packages/lib/actions'
import * as libFormulas from '../packages/lib/formulas'

type FormulaContext = Parameters<FormulaHandler>[1]
type ActionContext = Parameters<ActionHandler>[1]

/**
 * A single std-lib invocation batch. `iterations` handler calls are performed
 * so every measurement covers a realistic amount of work.
 */
type Bench = (iterations: number) => void | Promise<void>

type LibBenchmarkRunner = {
  iterations: number
  run: () => void | Promise<void>
}

type LibCaseFactory = () => Promise<LibBenchmarkRunner>

type WorkerRequest = { type: 'close' } | { type: 'run'; count?: number }

type WorkerResponse = { timeMs: number } | { error: string }

const TARGET_SAMPLE_MS = 5
const MAX_ITERATIONS = 250_000
/** Timer based actions must not flood the event loop with pending timers. */
const MAX_TIMER_ITERATIONS = 200
/** `gotToURL` posts a message per call; keep the message queue small. */
const MAX_MESSAGE_ITERATIONS = 2_000

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const requireFromLib = createRequire(
  resolve(repositoryRoot, 'packages/lib/package.json'),
)
const fastDeepEqual = requireFromLib('fast-deep-equal') as (
  a: unknown,
  b: unknown,
) => boolean

const formulaHandlers = libFormulas as unknown as Record<
  string,
  { default: FormulaHandler }
>
const actionHandlers = libActions as unknown as Record<
  string,
  { default: ActionHandler }
>

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

const asProduct = (item: unknown) => item as Product

const isInStock = ({ item }: { item?: unknown }) => asProduct(item).inStock
const isOutOfStock = ({ item }: { item?: unknown }) => !asProduct(item).inStock
const isPricey = ({ item }: { item?: unknown }) => asProduct(item).price > 400
const toLabel = ({ item }: { item?: unknown }) => {
  const product = asProduct(item)
  return `${product.title} (${product.sku})`
}
const toCategory = ({ item }: { item?: unknown }) => asProduct(item).category
const toId = ({ item }: { item?: unknown }) => asProduct(item).id
const toPrice = ({ item }: { item?: unknown }) => asProduct(item).price
const addOrderTotal = ({
  result,
  item,
}: {
  result?: unknown
  item?: unknown
}) => Number(result ?? 0) + (item as (typeof ORDERS)[number]).total

const LONG_DATE_OPTIONS = {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Europe/Copenhagen',
} as const

const CURRENCY_OPTIONS = {
  style: 'currency',
  currency: 'DKK',
  currencyDisplay: 'narrowSymbol',
} as const

const SLUG_PATTERN = '[a-z]+'
const PRODUCT_COUNT = PRODUCTS.length
const TITLE_COUNT = TITLES.length
const DATE_COUNT = PRODUCT_DATES.length
const ORDER_COUNT = ORDERS.length
const DESCRIPTION_COUNT = DESCRIPTIONS.length
const TAG_LIST_COUNT = TAG_LISTS.length
const STORAGE_KEY_COUNT = STORAGE_KEYS.length
const FIELD_COUNT = FORM_FIELD_IDS.length
const MIXED_VALUE_COUNT = MIXED_VALUES.length
const COLLECTION_COUNT = COLLECTIONS.length
const URL_COUNT = COLLECTION_URLS.length
const BASE64_COUNT = BASE64_TITLES.length
const QUERY_COUNT = ENCODED_QUERIES.length
const ISO_DATE_COUNT = ISO_DATES.length
const JSON_COUNT = JSON_PRODUCTS.length
const CSV_COUNT = CSV_ROWS.length
const DIMENSION_COUNT = DIMENSIONS.length
const RATING_COUNT = RATINGS.length
const PRICE_COUNT = PRICES.length
const TIMESTAMP_COUNT = PRODUCT_TIMESTAMPS.length
const PADDED_TITLE_COUNT = PADDED_TITLES.length
const TOTAL_COUNT = ORDER_TOTALS.length

const SHARED_ABORT_SIGNAL = new AbortController().signal
const PREVIEW_ENV: ToddleEnv = {
  isServer: false,
  branchName: 'main',
  request: undefined,
  runtime: 'preview',
  logErrors: false,
}
const BROWSER_ENV: ToddleEnv = {
  isServer: false,
  branchName: 'main',
  request: undefined,
  runtime: 'page',
  logErrors: false,
}

let formulaContext: FormulaContext | undefined
let browserActionContext: ActionContext | undefined
let previewActionContext: ActionContext | undefined
let documentEvents: Event[] = []
let documentInputs: HTMLInputElement[] = []
let _triggeredEventCount = 0
let themeValue: string | null = null
/** Console output of the benchmark runner itself, kept out of the log stub. */
let writeOutput = (...args: unknown[]) => console.log(...args)

const installEnvironment = (verbose: boolean) => {
  if (formulaContext) {
    return
  }

  GlobalRegistrator.register({ url: BENCHMARK_URL })

  // `equals`, `notEqual`, `includes`, `indexOf` and `lastIndexOf` read the
  // deep equality helper from the global toddle instance.
  ;(
    globalThis as unknown as {
      toddle: { isEqual: (a: unknown, b: unknown) => boolean }
    }
  ).toddle = { isEqual: fastDeepEqual }

  // `logToConsole` would otherwise flood stdout and corrupt the worker
  // protocol, so handler output is only forwarded when the run is verbose.
  const originalLog = console.log.bind(console)
  writeOutput = originalLog
  console.log = (...args: unknown[]) => {
    if (verbose) {
      originalLog(...args)
    }
  }

  for (const [name, value] of Object.entries(COOKIE_VALUES)) {
    document.cookie = `${name}=${value}; Path=/`
  }
  for (const [key, value] of Object.entries(LOCAL_STORAGE_VALUES)) {
    window.localStorage.setItem(key, JSON.stringify(value))
  }
  for (const [key, value] of Object.entries(SESSION_STORAGE_VALUES)) {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  }

  // A realistic checkout form gives `getElementById` and `focus` a document to
  // look through instead of an empty page.
  const form = document.createElement('form')
  form.id = 'checkout-form'
  for (const id of FORM_FIELD_IDS) {
    const input = document.createElement('input')
    input.id = id
    input.name = id
    input.value = `value-${id}`
    form.append(input)
  }
  document.body.append(form)
  documentInputs = FORM_FIELD_IDS.map((id) =>
    document.getElementById(id),
  ) as HTMLInputElement[]

  documentEvents = Array.from({ length: 64 }, (_, index) => {
    const type = ['submit', 'click', 'input', 'change'][index % 4] as string
    return new Event(type, { bubbles: true, cancelable: true })
  })

  // `navigator.share`, `navigator.canShare` and `cookieStore.set` are not
  // implemented by happy-dom.
  Object.defineProperty(window.navigator, 'canShare', {
    configurable: true,
    value: (data: ShareData) =>
      typeof data.url === 'string' || typeof data.title === 'string',
  })
  Object.defineProperty(window.navigator, 'share', {
    configurable: true,
    value: () => Promise.resolve(),
  })

  // `gotToURL` posts a message to the parent frame in preview mode. Swallow
  // them instead of queueing tens of thousands of no-op messages.
  Object.defineProperty(window, 'parent', {
    configurable: true,
    value: { postMessage: () => undefined },
  })

  // Cookie endpoints are only reachable over the network - answer them locally.
  globalThis.fetch = (() =>
    Promise.resolve(
      new Response('{"success":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )) as typeof fetch

  formulaContext = {
    component: undefined as unknown as FormulaContext['component'],
    data: {
      Attributes: {},
      Variables: {
        products: PRODUCTS,
        product: PRODUCTS[0],
        cart: CART,
        orders: ORDERS,
        users: USERS,
      },
    },
    root: document,
    env: BROWSER_ENV,
  }

  const createActionContext = (
    env: ToddleEnv,
    abortSignal: AbortSignal,
  ): ActionContext => ({
    triggerActionEvent: () => {
      _triggeredEventCount++
    },
    env,
    abortSignal,
    stores: {
      theme: {
        set: (value: string | null) => {
          themeValue = value
        },
        get: () => themeValue,
      },
    },
  })

  browserActionContext = createActionContext(BROWSER_ENV, SHARED_ABORT_SIGNAL)
  previewActionContext = createActionContext(PREVIEW_ENV, SHARED_ABORT_SIGNAL)
}

/**
 * Picks the iteration count that keeps a single sample around
 * `TARGET_SAMPLE_MS`. Samples are reported per iteration so base and head stay
 * comparable even when they calibrate to different counts.
 */
const calibrate = async (bench: Bench, maxIterations: number) => {
  let iterations = 1
  for (;;) {
    const start = performance.now()
    await bench(iterations)
    const elapsed = performance.now() - start
    if (elapsed >= TARGET_SAMPLE_MS || iterations >= maxIterations) {
      return Math.max(1, iterations)
    }
    const scale = TARGET_SAMPLE_MS / Math.max(elapsed, 0.05)
    iterations = Math.min(
      maxIterations,
      Math.max(iterations + 1, Math.ceil(iterations * Math.min(scale, 64))),
    )
  }
}

const createCalibratedRunner = async (
  bench: Bench,
  options?: { maxIterations?: number },
): Promise<LibBenchmarkRunner> => {
  const iterations = await calibrate(
    bench,
    options?.maxIterations ?? MAX_ITERATIONS,
  )
  return { iterations, run: () => bench(iterations) }
}

const formulaCase =
  (bench: Bench, options?: { maxIterations?: number }): LibCaseFactory =>
  () =>
    createCalibratedRunner(bench, options)

const actionCase =
  (bench: Bench, options?: { maxIterations?: number }): LibCaseFactory =>
  () =>
    createCalibratedRunner(bench, options)

const formula = (name: string) => {
  const handler = formulaHandlers[name]?.default
  if (typeof handler !== 'function') {
    throw new Error(`Missing std-lib formula handler for ${name}`)
  }
  return handler
}

const action = (name: string) => {
  const handler = actionHandlers[name]?.default
  if (typeof handler !== 'function') {
    throw new Error(`Missing std-lib action handler for ${name}`)
  }
  // Implementations are a mix of sync and async handlers; type the result as
  // returning unknown so `await handler(...)` is valid for both.
  return handler as (
    ...args: Parameters<ActionHandler>
  ) => unknown | Promise<unknown>
}

const getFormulaContext = () => {
  if (!formulaContext) {
    throw new Error('Benchmark environment has not been installed')
  }
  return formulaContext
}

const getActionContext = () => {
  if (!browserActionContext) {
    throw new Error('Benchmark environment has not been installed')
  }
  return browserActionContext
}

const getPreviewActionContext = () => {
  if (!previewActionContext) {
    throw new Error('Benchmark environment has not been installed')
  }
  return previewActionContext
}

const seedLocalStorage = (count: number) => {
  for (let index = 0; index < count; index++) {
    window.localStorage.setItem(`benchmark-key-${index}`, JSON.stringify(index))
  }
}

const seedSessionStorage = (count: number) => {
  for (let index = 0; index < count; index++) {
    window.sessionStorage.setItem(
      `benchmark-key-${index}`,
      JSON.stringify(index),
    )
  }
}

/**
 * `interval` and `sleep` install a fresh abort listener on every call, so they
 * get their own context to avoid leaking listeners across iterations.
 */
const getActionContextForSignal = (
  abortSignal: AbortSignal,
): ActionContext => ({
  ...getActionContext(),
  abortSignal,
})

const CASES = {
  // --------------------------------------------------------------- formulas
  'formula-id': formulaCase((iterations) => {
    const handler = formula('Id')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([], ctx)
    }
  }),
  'formula-absolute': formulaCase((iterations) => {
    const handler = formula('absolute')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRICES[i % PRICE_COUNT]], ctx)
    }
  }),
  'formula-add': formulaCase((iterations) => {
    const handler = formula('add')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler(PRICES, ctx)
    }
  }),
  'formula-append': formulaCase((iterations) => {
    const handler = formula('append')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, PRODUCTS[i % PRODUCT_COUNT]], ctx)
    }
  }),
  'formula-boolean': formulaCase((iterations) => {
    const handler = formula('boolean')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([MIXED_VALUES[i % MIXED_VALUE_COUNT]], ctx)
    }
  }),
  'formula-branch-name': formulaCase((iterations) => {
    const handler = formula('branchName')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([], ctx)
    }
  }),
  'formula-can-share': formulaCase((iterations) => {
    const handler = formula('canShare')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([BENCHMARK_URL, 'Nordcraft', ARTICLE_BODY.slice(0, 120)], ctx)
    }
  }),
  'formula-capitalize': formulaCase((iterations) => {
    const handler = formula('capitalize')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([TITLES[i % TITLE_COUNT]], ctx)
    }
  }),
  'formula-clamp': formulaCase((iterations) => {
    const handler = formula('clamp')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRICES[i % PRICE_COUNT], 50, 500], ctx)
    }
  }),
  'formula-concatenate': formulaCase((iterations) => {
    const handler = formula('concatenate')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler(
        [TAG_LISTS[i % TAG_LIST_COUNT], TAG_LISTS[(i + 1) % TAG_LIST_COUNT]],
        ctx,
      )
    }
  }),
  'formula-current-url': formulaCase((iterations) => {
    const handler = formula('currentURL')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([], ctx)
    }
  }),
  'formula-date-from-string': formulaCase((iterations) => {
    const handler = formula('dateFromString')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([ISO_DATES[i % ISO_DATE_COUNT]], ctx)
    }
  }),
  'formula-date-from-timestamp': formulaCase((iterations) => {
    const handler = formula('dateFromTimestamp')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCT_TIMESTAMPS[i % TIMESTAMP_COUNT]], ctx)
    }
  }),
  'formula-decode-base64': formulaCase((iterations) => {
    const handler = formula('decodeBase64')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([BASE64_TITLES[i % BASE64_COUNT]], ctx)
    }
  }),
  'formula-decode-uricomponent': formulaCase((iterations) => {
    const handler = formula('decodeURIComponent')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([ENCODED_QUERIES[i % QUERY_COUNT]], ctx)
    }
  }),
  'formula-default-to': formulaCase((iterations) => {
    const handler = formula('defaultTo')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler(
        [undefined, null, '', 0, false, `${BENCHMARK_ORIGIN}/fallback`],
        ctx,
      )
    }
  }),
  'formula-delete-key': formulaCase((iterations) => {
    const handler = formula('deleteKey')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([CART, ['lines', String(i % CART.lines.length), 'quantity']], ctx)
    }
  }),
  'formula-divide': formulaCase((iterations) => {
    const handler = formula('divide')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler(
        [PRICES[i % PRICE_COUNT], ORDERS[i % ORDER_COUNT].lines.length],
        ctx,
      )
    }
  }),
  'formula-drop': formulaCase((iterations) => {
    const handler = formula('drop')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, (i % 24) + 1], ctx)
    }
  }),
  'formula-drop-last': formulaCase((iterations) => {
    const handler = formula('dropLast')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, (i % 24) + 1], ctx)
    }
  }),
  'formula-encode-base64': formulaCase((iterations) => {
    const handler = formula('encodeBase64')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([TITLES[i % TITLE_COUNT]], ctx)
    }
  }),
  'formula-encode-json': formulaCase((iterations) => {
    const handler = formula('encodeJSON')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS[i % PRODUCT_COUNT], 2], ctx)
    }
  }),
  'formula-encode-uricomponent': formulaCase((iterations) => {
    const handler = formula('encodeURIComponent')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([TITLES[i % TITLE_COUNT]], ctx)
    }
  }),
  'formula-entries': formulaCase((iterations) => {
    const handler = formula('entries')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([i % 2 === 0 ? CART : PRODUCT_BY_ID], ctx)
    }
  }),
  'formula-equals': formulaCase((iterations) => {
    const handler = formula('equals')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler(
        [PRODUCTS[i % PRODUCT_COUNT], PRODUCT_COPIES[i % PRODUCT_COUNT]],
        ctx,
      )
    }
  }),
  'formula-every': formulaCase((iterations) => {
    const handler = formula('every')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, isInStock], ctx)
    }
  }),
  'formula-filter': formulaCase((iterations) => {
    const handler = formula('filter')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, isInStock], ctx)
    }
  }),
  'formula-find': formulaCase((iterations) => {
    const handler = formula('find')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, isOutOfStock], ctx)
    }
  }),
  'formula-find-index': formulaCase((iterations) => {
    const handler = formula('findIndex')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, isOutOfStock], ctx)
    }
  }),
  'formula-find-last': formulaCase((iterations) => {
    const handler = formula('findLast')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, isOutOfStock], ctx)
    }
  }),
  'formula-first': formulaCase((iterations) => {
    const handler = formula('first')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS], ctx)
    }
  }),
  'formula-flatten': formulaCase((iterations) => {
    const handler = formula('flatten')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([NESTED_TAGS], ctx)
    }
  }),
  'formula-format-date': formulaCase((iterations) => {
    const handler = formula('formatDate')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCT_DATES[i % DATE_COUNT], 'da-DK', LONG_DATE_OPTIONS], ctx)
    }
  }),
  'formula-format-number': formulaCase((iterations) => {
    const handler = formula('formatNumber')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRICES[i % PRICE_COUNT], 'da-DK', CURRENCY_OPTIONS], ctx)
    }
  }),
  'formula-from-entries': formulaCase((iterations) => {
    const handler = formula('fromEntries')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCT_LABELS], ctx)
    }
  }),
  'formula-get': formulaCase((iterations) => {
    const handler = formula('get')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler(
        [CART, ['lines', String(i % CART.lines.length), 'productId']],
        ctx,
      )
    }
  }),
  'formula-get-cookie': formulaCase((iterations) => {
    const handler = formula('getCookie')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler(['session_id'], ctx)
    }
  }),
  'formula-get-element-by-id': formulaCase((iterations) => {
    const handler = formula('getElementById')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([FORM_FIELD_IDS[i % FIELD_COUNT]], ctx)
    }
  }),
  'formula-get-from-local-storage': formulaCase((iterations) => {
    const handler = formula('getFromLocalStorage')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([STORAGE_KEYS[i % STORAGE_KEY_COUNT]], ctx)
    }
  }),
  'formula-get-from-session-storage': formulaCase((iterations) => {
    const handler = formula('getFromSessionStorage')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([SESSION_STORAGE_KEYS[i % SESSION_STORAGE_KEYS.length]], ctx)
    }
  }),
  'formula-get-http-only-cookie': formulaCase((iterations) => {
    const handler = formula('getHttpOnlyCookie')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler(['session_id'], ctx)
    }
  }),
  'formula-greater-or-equeal': formulaCase((iterations) => {
    const handler = formula('greaterOrEqueal')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRICES[i % PRICE_COUNT], 250], ctx)
    }
  }),
  'formula-greater-than': formulaCase((iterations) => {
    const handler = formula('greaterThan')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRICES[i % PRICE_COUNT], 250], ctx)
    }
  }),
  'formula-group-by': formulaCase((iterations) => {
    const handler = formula('groupBy')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, toCategory], ctx)
    }
  }),
  'formula-includes': formulaCase((iterations) => {
    const handler = formula('includes')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, PRODUCT_COPIES[PRODUCT_COUNT - 1]], ctx)
    }
  }),
  'formula-index-of': formulaCase((iterations) => {
    const handler = formula('indexOf')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, PRODUCT_COPIES[PRODUCT_COUNT - 1]], ctx)
    }
  }),
  'formula-is-server': formulaCase((iterations) => {
    const handler = formula('isServer')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([], ctx)
    }
  }),
  'formula-join': formulaCase((iterations) => {
    const handler = formula('join')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([TAG_LISTS[i % TAG_LIST_COUNT], ', '], ctx)
    }
  }),
  'formula-json': formulaCase((iterations) => {
    const handler = formula('json')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([ORDERS[i % ORDER_COUNT], 2], ctx)
    }
  }),
  'formula-key-by': formulaCase((iterations) => {
    const handler = formula('keyBy')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, toId], ctx)
    }
  }),
  'formula-languages': formulaCase((iterations) => {
    const handler = formula('languages')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([], ctx)
    }
  }),
  'formula-last': formulaCase((iterations) => {
    const handler = formula('last')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS], ctx)
    }
  }),
  'formula-last-index-of': formulaCase((iterations) => {
    const handler = formula('lastIndexOf')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, PRODUCT_COPIES[PRODUCT_COUNT - 1]], ctx)
    }
  }),
  'formula-less-or-equal': formulaCase((iterations) => {
    const handler = formula('lessOrEqual')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRICES[i % PRICE_COUNT], 250], ctx)
    }
  }),
  'formula-less-than': formulaCase((iterations) => {
    const handler = formula('lessThan')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRICES[i % PRICE_COUNT], 250], ctx)
    }
  }),
  'formula-logarithm': formulaCase((iterations) => {
    const handler = formula('logarithm')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRICES[i % PRICE_COUNT]], ctx)
    }
  }),
  'formula-lowercase': formulaCase((iterations) => {
    const handler = formula('lowercase')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([DESCRIPTIONS[i % DESCRIPTION_COUNT]], ctx)
    }
  }),
  'formula-map': formulaCase((iterations) => {
    const handler = formula('map')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, toLabel], ctx)
    }
  }),
  'formula-matches': formulaCase((iterations) => {
    const handler = formula('matches')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([ARTICLE_BODY, SLUG_PATTERN, true, true, false], ctx)
    }
  }),
  'formula-max': formulaCase((iterations) => {
    const handler = formula('max')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler(PRICES, ctx)
    }
  }),
  'formula-min': formulaCase((iterations) => {
    const handler = formula('min')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler(PRICES, ctx)
    }
  }),
  'formula-minus': formulaCase((iterations) => {
    const handler = formula('minus')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRICES[i % PRICE_COUNT], ORDER_TOTALS[i % TOTAL_COUNT]], ctx)
    }
  }),
  'formula-modulo': formulaCase((iterations) => {
    const handler = formula('modulo')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRICES[i % PRICE_COUNT], (i % 12) + 2], ctx)
    }
  }),
  'formula-multiply': formulaCase((iterations) => {
    const handler = formula('multiply')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([2, 3, 1.5, 0.99, 12, 7], ctx)
    }
  }),
  'formula-not': formulaCase((iterations) => {
    const handler = formula('not')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([MIXED_VALUES[i % MIXED_VALUE_COUNT]], ctx)
    }
  }),
  'formula-not-equal': formulaCase((iterations) => {
    const handler = formula('notEqual')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler(
        [PRODUCTS[i % PRODUCT_COUNT], PRODUCT_COPIES[i % PRODUCT_COUNT]],
        ctx,
      )
    }
  }),
  'formula-now': formulaCase((iterations) => {
    const handler = formula('now')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([], ctx)
    }
  }),
  'formula-number': formulaCase((iterations) => {
    const handler = formula('number')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([MIXED_VALUES[i % MIXED_VALUE_COUNT]], ctx)
    }
  }),
  'formula-parse-json': formulaCase((iterations) => {
    const handler = formula('parseJSON')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([JSON_PRODUCTS[i % JSON_COUNT], true], ctx)
    }
  }),
  'formula-parse-url': formulaCase((iterations) => {
    const handler = formula('parseURL')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([COLLECTION_URLS[i % URL_COUNT], BENCHMARK_ORIGIN], ctx)
    }
  }),
  'formula-power': formulaCase((iterations) => {
    const handler = formula('power')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([RATINGS[i % RATING_COUNT], 2], ctx)
    }
  }),
  'formula-prepend': formulaCase((iterations) => {
    const handler = formula('prepend')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, PRODUCTS[i % PRODUCT_COUNT]], ctx)
    }
  }),
  'formula-random-number': formulaCase((iterations) => {
    const handler = formula('randomNumber')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([], ctx)
    }
  }),
  'formula-range': formulaCase((iterations) => {
    const handler = formula('range')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([1, (i % 24) + 1], ctx)
    }
  }),
  'formula-reduce': formulaCase((iterations) => {
    const handler = formula('reduce')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([ORDERS, addOrderTotal, 0], ctx)
    }
  }),
  'formula-replace-all': formulaCase((iterations) => {
    const handler = formula('replaceAll')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler(
        [
          DESCRIPTIONS[i % DESCRIPTION_COUNT],
          'our European warehouse',
          'our EU warehouse',
        ],
        ctx,
      )
    }
  }),
  'formula-reverse': formulaCase((iterations) => {
    const handler = formula('reverse')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS], ctx)
    }
  }),
  'formula-round': formulaCase((iterations) => {
    const handler = formula('round')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRICES[i % PRICE_COUNT], 2], ctx)
    }
  }),
  'formula-round-down': formulaCase((iterations) => {
    const handler = formula('roundDown')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRICES[i % PRICE_COUNT], 2], ctx)
    }
  }),
  'formula-round-up': formulaCase((iterations) => {
    const handler = formula('roundUp')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRICES[i % PRICE_COUNT], 2], ctx)
    }
  }),
  'formula-set': formulaCase((iterations) => {
    const handler = formula('set')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler(
        [CART, ['lines', String(i % CART.lines.length), 'quantity'], 3],
        ctx,
      )
    }
  }),
  'formula-shuffle': formulaCase((iterations) => {
    const handler = formula('shuffle')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS], ctx)
    }
  }),
  'formula-size': formulaCase((iterations) => {
    const handler = formula('size')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([COLLECTIONS[i % COLLECTION_COUNT]], ctx)
    }
  }),
  'formula-some': formulaCase((iterations) => {
    const handler = formula('some')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, isPricey], ctx)
    }
  }),
  'formula-sort-by': formulaCase((iterations) => {
    const handler = formula('sort_by')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, toPrice, i % 2 === 0], ctx)
    }
  }),
  'formula-split': formulaCase((iterations) => {
    const handler = formula('split')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([CSV_ROWS[i % CSV_COUNT], ','], ctx)
    }
  }),
  'formula-square-root': formulaCase((iterations) => {
    const handler = formula('squareRoot')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([DIMENSIONS[i % DIMENSION_COUNT]], ctx)
    }
  }),
  'formula-starts-with': formulaCase((iterations) => {
    const handler = formula('startsWith')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([SKUS[i % PRICE_COUNT], 'SKU-000'], ctx)
    }
  }),
  'formula-string': formulaCase((iterations) => {
    const handler = formula('string')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([MIXED_VALUES[i % MIXED_VALUE_COUNT]], ctx)
    }
  }),
  'formula-sum': formulaCase((iterations) => {
    const handler = formula('sum')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([ORDER_TOTALS], ctx)
    }
  }),
  'formula-take': formulaCase((iterations) => {
    const handler = formula('take')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, (i % 24) + 1], ctx)
    }
  }),
  'formula-take-last': formulaCase((iterations) => {
    const handler = formula('takeLast')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCTS, (i % 24) + 1], ctx)
    }
  }),
  'formula-timestamp': formulaCase((iterations) => {
    const handler = formula('timestamp')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PRODUCT_DATES[i % DATE_COUNT]], ctx)
    }
  }),
  'formula-trim': formulaCase((iterations) => {
    const handler = formula('trim')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([PADDED_TITLES[i % PADDED_TITLE_COUNT]], ctx)
    }
  }),
  'formula-type-of': formulaCase((iterations) => {
    const handler = formula('typeOf')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([MIXED_VALUES[i % MIXED_VALUE_COUNT]], ctx)
    }
  }),
  'formula-unique': formulaCase((iterations) => {
    const handler = formula('unique')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([TAGS_WITH_DUPLICATES], ctx)
    }
  }),
  'formula-uppercase': formulaCase((iterations) => {
    const handler = formula('uppercase')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([TITLES[i % TITLE_COUNT]], ctx)
    }
  }),
  'formula-user-agent': formulaCase((iterations) => {
    const handler = formula('userAgent')
    const ctx = getFormulaContext()
    for (let i = 0; i < iterations; i++) {
      handler([], ctx)
    }
  }),

  // ---------------------------------------------------------------- actions
  'action-clear-local-storage': actionCase(async (iterations) => {
    const handler = action('clearLocalStorage')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      seedLocalStorage(128)
      await handler([], ctx)
    }
  }),
  'action-clear-session-storage': actionCase(async (iterations) => {
    const handler = action('clearSessionStorage')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      seedSessionStorage(64)
      await handler([], ctx)
    }
  }),
  'action-copy-to-clipboard': actionCase(async (iterations) => {
    const handler = action('copyToClipboard')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      await handler([TITLES[i % TITLE_COUNT]], ctx)
    }
  }),
  'action-delete-from-local-storage': actionCase(async (iterations) => {
    const handler = action('deleteFromLocalStorage')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      seedLocalStorage(128)
      await handler([`benchmark-key-${i % 128}`], ctx)
    }
  }),
  'action-delete-from-session-storage': actionCase(async (iterations) => {
    const handler = action('deleteFromSessionStorage')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      seedSessionStorage(64)
      await handler([`benchmark-key-${i % 64}`], ctx)
    }
  }),
  'action-focus': actionCase((iterations) => {
    const handler = action('focus')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      handler([documentInputs[i % FIELD_COUNT], true], ctx)
    }
  }),
  'action-got-to-url': actionCase(
    (iterations) => {
      const handler = action('gotToURL')
      const ctx = getPreviewActionContext()
      for (let i = 0; i < iterations; i++) {
        handler([COLLECTION_URLS[i % URL_COUNT]], ctx)
      }
    },
    { maxIterations: MAX_MESSAGE_ITERATIONS },
  ),
  'action-interval': actionCase(
    (iterations) => {
      const handler = action('interval')
      for (let i = 0; i < iterations; i++) {
        const controller = new AbortController()
        handler([60_000], getActionContextForSignal(controller.signal))
        controller.abort()
      }
    },
    { maxIterations: MAX_TIMER_ITERATIONS },
  ),
  'action-log-to-console': actionCase((iterations) => {
    const handler = action('logToConsole')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      handler([`[benchmarks] iteration ${i}`, PRODUCTS[i % PRODUCT_COUNT]], ctx)
    }
  }),
  'action-prevent-default': actionCase((iterations) => {
    const handler = action('preventDefault')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      handler([], ctx, documentEvents[i % documentEvents.length])
    }
  }),
  'action-save-to-local-storage': actionCase(async (iterations) => {
    const handler = action('saveToLocalStorage')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      await handler([STORAGE_KEYS[i % STORAGE_KEY_COUNT], CART], ctx)
    }
  }),
  'action-save-to-session-storage': actionCase(async (iterations) => {
    const handler = action('saveToSessionStorage')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      await handler(
        [SESSION_STORAGE_KEYS[i % SESSION_STORAGE_KEYS.length], CART],
        ctx,
      )
    }
  }),
  'action-set-cookie': actionCase(async (iterations) => {
    const handler = action('setCookie')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      await handler(
        ['session_id', `a3f1c9d84b2e7f${i % 10}`, 3600, 'Lax', '/', true],
        ctx,
      )
    }
  }),
  'action-set-http-only-cookie': actionCase(async (iterations) => {
    const handler = action('setHttpOnlyCookie')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      await handler(
        ['session_id', `a3f1c9d84b2e7f${i % 10}`, 3600, 'Lax', '/', true],
        ctx,
      )
    }
  }),
  'action-set-session-cookies': actionCase(async (iterations) => {
    const handler = action('setSessionCookies')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      await handler([`access_token_${i % 10}`, 3600], ctx)
    }
  }),
  'action-set-theme': actionCase(async (iterations) => {
    const handler = action('setTheme')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      await handler([i % 2 === 0 ? 'dark' : 'light'], ctx)
    }
  }),
  'action-share': actionCase(async (iterations) => {
    const handler = action('share')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      await handler(
        [BENCHMARK_URL, 'Nordcraft', 'Take a look at this collection'],
        ctx,
      )
    }
  }),
  'action-sleep': actionCase(
    (iterations) => {
      const handler = action('sleep')
      for (let i = 0; i < iterations; i++) {
        const controller = new AbortController()
        handler([60_000], getActionContextForSignal(controller.signal))
        controller.abort()
      }
    },
    { maxIterations: MAX_TIMER_ITERATIONS },
  ),
  'action-stop-propagation': actionCase((iterations) => {
    const handler = action('stopPropagation')
    const ctx = getActionContext()
    for (let i = 0; i < iterations; i++) {
      handler([], ctx, documentEvents[i % documentEvents.length])
    }
  }),
} satisfies Record<LibBenchmarkCaseId, LibCaseFactory>

type LibArgs = {
  caseId: LibBenchmarkCaseId
  repeat: number
  isWorker: boolean
  runs: number
  warmup: number
  outputPath?: string
  json: boolean
  verbose: boolean
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
    verbose: getBoolean(args, '--verbose', false),
  }
}

export const createRunner = async (
  caseId: LibBenchmarkCaseId,
  options?: { verbose?: boolean },
): Promise<LibBenchmarkRunner> => {
  installEnvironment(options?.verbose ?? false)
  const factory = CASES[caseId]
  if (typeof factory !== 'function') {
    throw new Error(`Missing benchmark runner for case ${caseId}`)
  }
  return factory()
}

const collectGarbage = () => {
  if (typeof Bun !== 'undefined' && typeof Bun.gc === 'function') {
    Bun.gc(true)
  }
}

/**
 * Samples are normalized per handler invocation so base and head stay
 * comparable even when they calibrate to different iteration counts.
 */
const measure = async (
  runner: LibBenchmarkRunner,
  repeat: number,
  count = 1,
) => {
  collectGarbage()
  const batches = count * repeat
  const start = performance.now()
  for (let i = 0; i < batches; i++) {
    await runner.run()
  }
  return (performance.now() - start) / batches / runner.iterations
}

const writeWorkerResponse = (response: WorkerResponse) => {
  process.stdout.write(`${JSON.stringify(response)}\n`)
}

const runWorker = async (runner: LibBenchmarkRunner, repeat: number) => {
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

const runDirect = async (runner: LibBenchmarkRunner, options: LibArgs) => {
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
    iterations: runner.iterations,
    timesMs,
  }

  if (options.outputPath) {
    await Bun.write(options.outputPath, `${JSON.stringify(result, null, 2)}\n`)
  } else if (options.json) {
    process.stdout.write(`${JSON.stringify(result)}\n`)
  } else {
    writeOutput(
      `[${options.caseId}] ${runner.iterations} iterations/sample, median: ${median(timesMs).toExponential(3)} ms`,
    )
  }
}

export const main = async (argv: readonly string[] = Bun.argv.slice(2)) => {
  const options = parseLibArgs(argv)
  const runner = await createRunner(options.caseId, {
    verbose: options.verbose,
  })
  if (options.isWorker) {
    await runWorker(runner, options.repeat)
  } else {
    await runDirect(runner, options)
  }
}

if (import.meta.main) {
  await main()
}
