/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  createApiEvent,
  createApiRequest,
  isApiError,
  requestHash,
} from '@nordcraft/core/dist/api/api'
import type {
  ApiPerformance,
  ApiRequest,
  ApiStatus,
  ToddleRequestInit,
} from '@nordcraft/core/dist/api/apiTypes'
import {
  isEventStreamHeader,
  isImageHeader,
  isJsonHeader,
  isJsonStreamHeader,
  isTextHeader,
} from '@nordcraft/core/dist/api/headers'
import type { ActionModel } from '@nordcraft/core/dist/component/component.types'
import type {
  Formula,
  FormulaContext,
  ValueOperationValue,
} from '@nordcraft/core/dist/formula/formula'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import type { NestedOmit, RequireFields } from '@nordcraft/core/dist/types'
import {
  omitPaths,
  sortObjectEntries,
} from '@nordcraft/core/dist/utils/collections'
import { PROXY_URL_HEADER, validateUrl } from '@nordcraft/core/dist/utils/url'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import { handleAction } from '../events/handleAction'
import type { Signal } from '../signal/signal'
import type { ComponentContext, ContextApi } from '../types'

/**
 * Set up an api v2 for a component.
 */
export function createAPI(
  apiRequest: ApiRequest,
  ctx: ComponentContext,
): RequireFields<ContextApi, 'update' | 'triggerActions'> {
  // If `__toddle` isn't found it is in a web component context. We behave as if the page isn't loaded.
  let timer: any = null
  let api = { ...apiRequest }

  function constructRequest(api: ApiRequest) {
    // Get baseUrl and validate it. (It wont be in web component context)
    let baseUrl: string | undefined = window.origin
    try {
      new URL(baseUrl)
    } catch {
      baseUrl = undefined
    }

    return createApiRequest({
      api,
      formulaContext: getFormulaContext(api),
      baseUrl,
      defaultHeaders: undefined,
    })
  }

  // Create the formula context for the api
  function getFormulaContext(api: ApiRequest): FormulaContext {
    // Use the general formula context to evaluate the arguments of the api
    const formulaContext = {
      data: ctx.dataSignal.get(),
      component: ctx.component,
      formulaCache: ctx.formulaCache,
      root: ctx.root,
      package: ctx.package,
      toddle: ctx.toddle,
      env: ctx.env,
    }

    // Make sure inputs are also available in the formula context
    const evaluatedInputs = Object.entries(api.inputs).reduce<
      Record<string, unknown>
    >((acc, [key, value]) => {
      acc[key] = applyFormula(value.formula, formulaContext)
      return acc
    }, {})

    const data = {
      ...formulaContext.data,
      ApiInputs: {
        ...evaluatedInputs,
      },
    }

    return {
      component: ctx.component,
      formulaCache: ctx.formulaCache,
      root: ctx.root,
      package: ctx.package,
      data,
      toddle: ctx.toddle,
      env: ctx.env,
    }
  }

  function handleRedirectRules(api: ApiRequest) {
    for (const [ruleName, rule] of sortObjectEntries(
      api.redirectRules ?? {},
      ([_, rule]) => rule.index,
    )) {
      const location = applyFormula(rule.formula, {
        ...getFormulaContext(api),
        data: {
          ...getFormulaContext(api).data,
          Apis: {
            [api.name]: ctx.dataSignal.get().Apis?.[api.name] as ApiStatus,
          },
        },
      })
      if (typeof location === 'string') {
        const url = validateUrl({
          path: location,
          origin: window.location.origin,
        })
        if (url) {
          if (ctx.env.runtime === 'preview') {
            // Attempt to notify the parent about the failed navigation attempt
            window.parent?.postMessage(
              { type: 'blockedNavigation', url: url.href },
              '*',
            )
            return { name: ruleName, index: rule.index, url }
          } else {
            window.location.replace(url.href)
          }
        }
      }
    }
  }

  function triggerActions(
    eventName: 'message' | 'success' | 'failed',
    api: ApiRequest,
    data: {
      body: unknown
      status?: number
      headers?: Record<string, string>
    },
  ) {
    switch (eventName) {
      case 'message': {
        const event = createApiEvent('message', data.body)
        api.client?.onMessage?.actions?.forEach((action) => {
          handleAction(
            action,
            {
              ...getFormulaContext(api).data,
              ...ctx.dataSignal.get(),
              Event: event,
            },
            ctx,
            event,
          )
        })
        break
      }
      case 'success': {
        const event = createApiEvent('success', data.body)
        api.client?.onCompleted?.actions?.forEach((action) => {
          handleAction(
            action,
            {
              ...getFormulaContext(api).data,
              ...ctx.dataSignal.get(),
              Event: event,
            },
            ctx,
            event,
          )
        })
        break
      }
      case 'failed': {
        const event = createApiEvent('failed', {
          error: data.body,
          status: data.status,
        })
        api.client?.onFailed?.actions?.forEach((action) => {
          handleAction(
            action,
            {
              ...getFormulaContext(api).data,
              ...ctx.dataSignal.get(),
              Event: event,
            },
            ctx,
            event,
          )
        })
        break
      }
    }
  }

  function apiSuccess(
    api: ApiRequest,
    data: {
      body: unknown
      status?: number
      headers?: Record<string, string>
    },
    performance: ApiPerformance,
  ) {
    const latestRequestStart =
      ctx.dataSignal.get().Apis?.[api.name]?.response?.performance?.requestStart
    if (
      typeof latestRequestStart === 'number' &&
      latestRequestStart > (performance.requestStart ?? 0)
    ) {
      return
    }

    ctx.dataSignal.set({
      ...ctx.dataSignal.get(),
      Apis: {
        ...ctx.dataSignal.get().Apis,
        [api.name]: {
          isLoading: false,
          data: data.body,
          error: null,
          response: {
            status: data.status,
            headers: data.headers,
            performance,
          },
        },
      },
    })
    const appliedRedirectRule = handleRedirectRules(api)
    if (appliedRedirectRule) {
      ctx.dataSignal.set({
        ...ctx.dataSignal.get(),
        Apis: {
          ...ctx.dataSignal.get().Apis,
          [api.name]: {
            isLoading: false,
            data: data.body,
            error: null,
            response: {
              status: data.status,
              headers: data.headers,
              performance,
              ...(ctx.env.runtime === 'preview'
                ? { debug: { appliedRedirectRule } }
                : {}),
            },
          },
        },
      })
    }
  }

  function apiError(
    api: ApiRequest,
    data: {
      body: unknown
      status?: number
      headers?: Record<string, string>
    },
    performance: ApiPerformance,
  ) {
    const latestRequestStart =
      ctx.dataSignal.get().Apis?.[api.name]?.response?.performance?.requestStart
    if (
      typeof latestRequestStart === 'number' &&
      latestRequestStart > (performance.requestStart ?? 0)
    ) {
      return
    }
    ctx.dataSignal.set({
      ...ctx.dataSignal.get(),
      Apis: {
        ...ctx.dataSignal.get().Apis,
        [api.name]: {
          isLoading: false,
          data: null,
          error: data.body,
          response: {
            status: data.status,
            headers: data.headers,
            performance,
          },
        },
      },
    })
    const appliedRedirectRule = handleRedirectRules(api)
    if (appliedRedirectRule) {
      ctx.dataSignal.set({
        ...ctx.dataSignal.get(),
        Apis: {
          ...ctx.dataSignal.get().Apis,
          [api.name]: {
            isLoading: false,
            data: null,
            error: data.body,
            response: {
              status: data.status,
              headers: data.headers,
              performance,
              ...(ctx.env.runtime === 'preview'
                ? { debug: { appliedRedirectRule } }
                : {}),
            },
          },
        },
      })
    }
  }

  // Execute the request - potentially to the cloudflare Query proxy
  async function execute(
    api: ApiRequest,
    url: URL,
    requestSettings: ToddleRequestInit,
  ) {
    const run = async () => {
      const performance: ApiPerformance = {
        requestStart: Date.now(),
        responseStart: null,
        responseEnd: null,
      }
      ctx.dataSignal.set({
        ...ctx.dataSignal.get(),
        Apis: {
          ...ctx.dataSignal.get().Apis,
          [api.name]: {
            isLoading: true,
            data: ctx.dataSignal.get().Apis?.[api.name]?.data ?? null,
            error: null,
          },
        },
      })
      let response

      try {
        const proxy = api.server?.proxy
          ? (applyFormula(
              api.server.proxy.enabled.formula,
              getFormulaContext(api),
            ) ?? false)
          : false

        if (proxy === false) {
          response = await fetch(url, requestSettings)
        } else {
          const proxyUrl = `/.toddle/omvej/components/${encodeURIComponent(
            ctx.component.name,
          )}/apis/${encodeURIComponent(
            ctx.component.name,
          )}:${encodeURIComponent(api.name)}`
          const headers = new Headers(requestSettings.headers)
          headers.set(
            PROXY_URL_HEADER,
            decodeURIComponent(url.href.replace(/\+/g, ' ')),
          )
          requestSettings.headers = headers
          response = await fetch(proxyUrl, requestSettings)
        }

        performance.responseStart = Date.now()
        await handleResponse(api, response, performance)
        return
      } catch (error: any) {
        const body = error.cause
          ? { message: error.message, data: error.cause }
          : error.message
        apiError(api, { body }, { ...performance, responseEnd: Date.now() })
        triggerActions('failed', api, { body })
        return Promise.reject(error)
      }
    }

    // Debounce the request if needed
    if (api.client?.debounce?.formula) {
      return new Promise((resolve, reject) => {
        if (typeof timer === 'number') {
          clearTimeout(timer)
        }
        timer = setTimeout(
          () => {
            run().then(resolve, reject)
          },
          applyFormula(api.client?.debounce?.formula, getFormulaContext(api)),
        )
      })
    }

    return run()
  }

  function handleResponse(
    api: ApiRequest,
    res: Response,
    performance: ApiPerformance,
  ) {
    let parserMode = api.client?.parserMode ?? 'auto'

    if (parserMode === 'auto') {
      const contentType = res.headers.get('content-type')
      if (isEventStreamHeader(contentType)) {
        parserMode = 'event-stream'
      } else if (isJsonHeader(contentType)) {
        parserMode = 'json'
      } else if (isTextHeader(contentType)) {
        parserMode = 'text'
      } else if (isJsonStreamHeader(contentType)) {
        parserMode = 'json-stream'
      } else if (isImageHeader(contentType)) {
        parserMode = 'blob'
      } else {
        parserMode = 'text'
      }
    }

    switch (parserMode) {
      case 'text':
        return textStreamResponse(api, res, performance)
      case 'json':
        return jsonResponse(api, res, performance)
      case 'event-stream':
        return eventStreamingResponse(api, res, performance)
      case 'json-stream':
        return jsonStreamResponse(api, res, performance)
      case 'blob':
        return blobResponse(api, res, performance)
      default:
        return textStreamResponse(api, res, performance)
    }
  }

  function textStreamResponse(
    api: ApiRequest,
    res: Response,
    performance: ApiPerformance,
  ) {
    return handleStreaming({
      api,
      res,
      performance,
      streamType: 'text',
      useTextDecoder: true,
      parseChunk: (chunk) => chunk,
      parseChunksForData: (chunks) => chunks.join(''),
    })
  }

  function jsonStreamResponse(
    api: ApiRequest,
    res: Response,
    performance: ApiPerformance,
  ) {
    const parseChunk = (chunk: any) => {
      let parsedData = chunk
      try {
        parsedData = JSON.parse(chunk)
      } catch {
        throw new Error('Error occurred while parsing the json chunk.', {
          cause: parsedData,
        })
      }
      return parsedData
    }

    return handleStreaming({
      api,
      res,
      performance,
      streamType: 'json',
      useTextDecoder: true,
      parseChunk,
      parseChunksForData: (chunks) => [...chunks],
      delimiters: ['\r\n', '\n'],
    })
  }

  async function jsonResponse(
    api: ApiRequest,
    res: Response,
    performance: ApiPerformance,
  ) {
    const body = await res.json()

    const status: ApiStatus = {
      data: body,
      isLoading: false,
      error: null,
      response: {
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
      },
    }
    return endResponse(api, status, performance)
  }

  async function blobResponse(
    api: ApiRequest,
    res: Response,
    performance: ApiPerformance,
  ) {
    const blob = await res.blob()

    const status: ApiStatus = {
      isLoading: false,
      data: URL.createObjectURL(blob),
      error: null,
      response: {
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
      },
    }
    return endResponse(api, status, performance)
  }

  function eventStreamingResponse(
    api: ApiRequest,
    res: Response,
    performance: ApiPerformance,
  ) {
    const parseChunk = (chunk: string) => {
      const event = chunk.match(/event: (.*)/)?.[1] ?? 'message'
      const data = chunk.match(/data: (.*)/)?.[1] ?? ''
      const id = chunk.match(/id: (.*)/)?.[1]
      const retry = chunk.match(/retry: (.*)/)?.[1]

      let parsedData = data
      try {
        parsedData = JSON.parse(data ?? '')
        // eslint-disable-next-line no-empty
      } catch {}
      const returnData = {
        event,
        data: parsedData,
        ...(id ? { id } : {}),
        ...(retry ? { retry } : {}),
      }
      return returnData
    }
    return handleStreaming({
      api,
      res,
      performance,
      streamType: 'event',
      useTextDecoder: true,
      parseChunk,
      parseChunksForData: (chunks) => [...chunks],
      delimiters: ['\n\n', '\r\n\r\n'],
    })
  }

  async function handleStreaming({
    api,
    res,
    performance,
    streamType,
    useTextDecoder,
    parseChunk,
    parseChunksForData,
    delimiters, // There can be various delimiters for the same stream. SSE might use both \n\n and \r\n\r\n
  }: {
    api: ApiRequest
    res: Response
    performance: ApiPerformance
    streamType: 'json' | 'text' | 'event'
    useTextDecoder: boolean
    parseChunk: (chunk: any) => any
    parseChunksForData: (chunks: any[]) => any
    delimiters?: string[]
  }) {
    const chunks: {
      chunks: any[]
      currentChunk: string
      add(chunk: string | Uint8Array): void
      processChunk(chunk: string | Uint8Array): void
    } = {
      chunks: [],
      currentChunk: '',
      // Function to add a chunk to the chunks array and emits the data to the onMessage event
      add(chunk: string | Uint8Array) {
        const parsedChunk = parseChunk(chunk)
        this.chunks.push(parsedChunk)
        // Only emit the data if there are any listeners
        if (parsedChunk) {
          ctx.dataSignal.set({
            ...ctx.dataSignal.get(),
            Apis: {
              ...ctx.dataSignal.get().Apis,
              [api.name]: {
                isLoading: true,
                data: parseChunksForData(this.chunks),
                error: null,
                response: {
                  headers: Object.fromEntries(res.headers.entries()),
                },
              },
            },
          })
          if ((api.client?.onMessage?.actions ?? []).length > 0) {
            triggerActions('message', api, { body: parsedChunk })
          }
        }
      },

      // Function to process a chunk and split it by the delimiter.
      processChunk(chunk: any) {
        const delimiter = delimiters?.find((d) => chunk.includes(d))
        const concatenated = this.currentChunk + chunk
        const split = delimiter ? concatenated.split(delimiter) : [concatenated]
        this.currentChunk = split.pop() ?? ''
        split.forEach((c) => this.add(c))
      },
    }

    const reader = useTextDecoder
      ? res.body?.pipeThrough(new TextDecoderStream()).getReader()
      : res.body?.getReader()

    while (reader) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      if (delimiters) {
        chunks.processChunk(value)
      } else {
        chunks.add(value)
      }
    }

    // First make sure theres no remaining chunk
    if (chunks.currentChunk) {
      chunks.add(chunks.currentChunk)
    }

    const status: ApiStatus = {
      isLoading: false,
      data: chunks.chunks,
      error: null,
      response: {
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
      },
    }

    try {
      if (streamType === 'json') {
        const parsed = JSON.parse(chunks.chunks.join(''))
        status.data = parsed
      } else if (streamType === 'text') {
        status.data = chunks.chunks.join('')
      }
    } catch {
      throw new Error('Error occurred while parsing the json chunk.', {
        cause: chunks.chunks.join(''),
      })
    }
    return endResponse(api, status, performance)
  }

  function endResponse(
    api: ApiRequest,
    apiStatus: ApiStatus,
    performance: ApiPerformance,
  ) {
    performance.responseEnd = Date.now()

    const data = {
      body: apiStatus.data,
      status: apiStatus.response?.status,
      headers: apiStatus.response?.headers ?? undefined,
    }

    const isError = isApiError({
      apiName: api.name,
      response: {
        body: data.body,
        ok: Boolean(
          !apiStatus.error &&
            apiStatus.response?.status &&
            apiStatus.response.status < 400,
        ),
        status: data.status,
        headers: data.headers,
      },
      formulaContext: getFormulaContext(api),
      errorFormula: api.isError,
      performance,
    })

    if (isError) {
      if (!data.body && apiStatus.error) {
        data.body = apiStatus.error
      }

      apiError(api, data, performance)
      triggerActions('failed', api, data)
    } else {
      apiSuccess(api, data, performance)
      triggerActions('success', api, data)
    }
  }

  function getApiForComparison(api: ApiRequest) {
    return omitPaths(api, [
      ['client', 'onCompleted'],
      ['client', 'onFailed'],
      ['client', 'onMessage'],
      ['service'],
      ['server', 'ssr'],
    ]) as NestedOmit<
      ApiRequest,
      | 'client.onCompleted'
      | 'client.onFailed'
      | 'client.onMessage'
      | 'service'
      | 'server.ssr'
    >
  }

  let payloadSignal:
    | Signal<{
        request: ReturnType<typeof constructRequest>
        api: ReturnType<typeof getApiForComparison>
        // if the evaluated value of autoFetch changes from false -> true, we need to refetch the api
        autoFetch: boolean
        // currently, the proxy setting is always controlled by a "value formula", but in case we later
        // open up for controlling it with a dynamic formula, we should also include it here
        proxy: boolean
      }>
    | undefined

  // eslint-disable-next-line prefer-const
  payloadSignal = ctx.dataSignal.map((_) => {
    const payloadContext = getFormulaContext(api)
    return {
      request: constructRequest(api),
      api: getApiForComparison(api),
      autoFetch: api.autoFetch
        ? applyFormula(api.autoFetch, payloadContext)
        : false,
      proxy: applyFormula(api.server?.proxy?.enabled.formula, payloadContext),
    }
  })
  payloadSignal.subscribe(async (_) => {
    const { url, requestSettings } = constructRequest(api)
    // Ensure we only use caching if the page is currently loading
    const cacheMatch =
      // We lookup the API from cache as long as autofetch is defined (and not statically falsy)
      // since the autofetch formula could've evaluated to true during SSR
      isDefined(api.autoFetch) &&
      (api.autoFetch.type !== 'value' || api.autoFetch.value === true) &&
      (window?.__toddle?.isPageLoaded ?? false) === false
        ? (ctx.toddle.pageState.Apis?.[
            requestHash(url, requestSettings)
          ] as ApiStatus)
        : undefined

    if (cacheMatch) {
      if (cacheMatch.error) {
        apiError(
          api,
          {
            body: cacheMatch.error,
            status: cacheMatch.response?.status,
            headers: cacheMatch.response?.headers ?? undefined,
          },
          {
            requestStart:
              cacheMatch.response?.performance?.requestStart ?? null,
            responseStart:
              cacheMatch.response?.performance?.responseStart ?? null,
            responseEnd: cacheMatch.response?.performance?.responseEnd ?? null,
          },
        )
      } else {
        apiSuccess(
          api,
          {
            body: cacheMatch.data,
            status: cacheMatch.response?.status,
            headers: cacheMatch.response?.headers ?? undefined,
          },
          {
            requestStart:
              cacheMatch.response?.performance?.requestStart ?? null,
            responseStart:
              cacheMatch.response?.performance?.responseStart ?? null,
            responseEnd: cacheMatch.response?.performance?.responseEnd ?? null,
          },
        )
      }
    } else {
      if (applyFormula(api.autoFetch, getFormulaContext(api))) {
        // Execute will set the initial status of the api in the dataSignal
        await execute(api, url, requestSettings)
      } else {
        ctx.dataSignal.update((data) => {
          return {
            ...data,
            Apis: {
              ...(data.Apis ?? {}),
              [api.name]: {
                isLoading: false,
                data: null,
                error: null,
              },
            },
          }
        })
      }
    }
  })

  return {
    fetch: ({
      actionInputs,
      actionModels,
    }: {
      actionInputs?: Record<
        string,
        | ValueOperationValue
        | {
            name: string
            formula?: Formula
          }
      >
      actionModels?: {
        onCompleted: ActionModel[]
        onFailed: ActionModel[]
        onMessage: ActionModel[]
      }
    }) => {
      // Inputs might already be evaluated. If they are we add them as a value formula to be evaluated later.
      const inputs = Object.entries(actionInputs ?? {}).reduce<
        Record<
          string,
          {
            formula: Formula
          }
        >
      >((acc, [inputName, input]) => {
        if (input !== null && typeof input === 'object' && 'formula' in input) {
          acc[inputName] = input as {
            formula: Formula
          }
        } else {
          acc[inputName] = {
            formula: { type: 'value', value: input },
          }
        }
        return acc
      }, {})

      const apiWithInputsAndActions: ApiRequest = {
        ...api,
        inputs: { ...api.inputs, ...inputs },
        client: {
          ...api.client,
          parserMode: api.client?.parserMode ?? 'auto',
          onCompleted: {
            trigger: api.client?.onCompleted?.trigger ?? 'success',
            actions: [
              ...(api.client?.onCompleted?.actions ?? []),
              ...(actionModels?.onCompleted ?? []),
            ],
          },
          onFailed: {
            trigger: api.client?.onFailed?.trigger ?? 'failed',
            actions: [
              ...(api.client?.onFailed?.actions ?? []),
              ...(actionModels?.onFailed ?? []),
            ],
          },
          onMessage: {
            trigger: api.client?.onMessage?.trigger ?? 'message',
            actions: [
              ...(api.client?.onMessage?.actions ?? []),
              ...(actionModels?.onMessage ?? []),
            ],
          },
        },
      }

      const { url, requestSettings } = constructRequest(apiWithInputsAndActions)

      return execute(apiWithInputsAndActions, url, requestSettings)
    },
    update: (newApi: ApiRequest) => {
      api = newApi
      const updateContext = getFormulaContext(api)
      const autoFetch =
        api.autoFetch && applyFormula(api.autoFetch, updateContext)
      if (autoFetch) {
        payloadSignal?.set({
          request: constructRequest(newApi),
          api: getApiForComparison(newApi),
          autoFetch,
          proxy: applyFormula(
            newApi.server?.proxy?.enabled.formula,
            updateContext,
          ),
        })
      }
    },
    triggerActions: () => {
      const apiData = ctx.dataSignal.get().Apis?.[api.name]
      if (
        apiData === undefined ||
        (apiData.data === null && apiData.error === null)
      ) {
        return
      }
      if (apiData.error) {
        triggerActions('failed', api, {
          body: apiData.error,
          status: apiData.response?.status,
        })
      } else {
        triggerActions('success', api, {
          body: apiData.data,
        })
      }
    },
    destroy: () => payloadSignal?.destroy(),
  }
}
