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
  mapHeadersToObject,
} from '@nordcraft/core/dist/api/headers'
import type { ComponentData } from '@nordcraft/core/dist/component/component.types'
import type {
  Formula,
  FormulaContext,
} from '@nordcraft/core/dist/formula/formula'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import type { NestedOmit } from '@nordcraft/core/dist/types'
import {
  omitPaths,
  sortObjectEntries,
} from '@nordcraft/core/dist/utils/collections'
import { PROXY_URL_HEADER, validateUrl } from '@nordcraft/core/dist/utils/url'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import { handleAction } from '../events/handleAction'
import type { Signal } from '../signal/signal'
import type { ComponentContext, ContextApiV2 } from '../types'

/**
 * Set up an api v2 for a component.
 */
export function createAPI({
  apiRequest,
  componentData: initialComponentData,
  ctx,
}: {
  apiRequest: ApiRequest
  componentData: ComponentData
  ctx: ComponentContext
}): ContextApiV2 {
  // If `__toddle` isn't found it is in a web component context. We behave as if the page isn't loaded.
  let timer: any = null
  let api = { ...apiRequest }

  function constructRequest(
    api: ApiRequest,
    componentData: ComponentData,
  ): ReturnType<typeof createApiRequest> {
    // Get baseUrl and validate it. (It wont be in web component context)
    let baseUrl: string | undefined = window.origin
    try {
      new URL(baseUrl)
    } catch {
      baseUrl = undefined
    }

    const request = createApiRequest({
      api,
      formulaContext: getFormulaContext(api, componentData),
      baseUrl,
      defaultHeaders: undefined,
    })
    return {
      ...request,
      requestSettings: {
        ...request.requestSettings,
        // credentials is a browser specific setting and cannot be set in the
        // createApiRequest function directly as it's shared between server and client
        credentials:
          api.client?.credentials &&
          ['include', 'same-origin', 'omit'].includes(api.client.credentials)
            ? api.client.credentials
            : // Default to same-origin
              undefined,
      },
    }
  }

  // Create the formula context for the api
  function getFormulaContext(
    api: ApiRequest,
    componentData: ComponentData | undefined,
  ): FormulaContext {
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
      ...componentData,
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

  function handleRedirectRules(api: ApiRequest, componentData: ComponentData) {
    for (const [ruleName, rule] of sortObjectEntries(
      api.redirectRules ?? {},
      ([_, rule]) => rule.index,
    )) {
      const formulaContext = getFormulaContext(api, componentData)
      const location = applyFormula(rule.formula, {
        ...formulaContext,
        data: {
          ...formulaContext.data,
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

  function triggerActions({
    eventName,
    api,
    data,
    componentData,
  }: {
    eventName: 'message' | 'success' | 'failed'
    api: ApiRequest
    data: {
      body: unknown
      status?: number
      headers?: Record<string, string>
    }
    componentData: ComponentData
  }) {
    switch (eventName) {
      case 'message': {
        const event = createApiEvent('message', data.body)
        api.client?.onMessage?.actions?.forEach((action) => {
          handleAction(
            action,
            {
              ...getFormulaContext(api, componentData).data,
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
              ...getFormulaContext(api, componentData).data,
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
              ...getFormulaContext(api, componentData).data,
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

  function apiSuccess({
    api,
    componentData,
    data,
    performance,
  }: {
    api: ApiRequest
    componentData: ComponentData
    data: {
      body: unknown
      status?: number
      headers?: Record<string, string>
    }
    performance: ApiPerformance
  }) {
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
    const appliedRedirectRule = handleRedirectRules(api, componentData)
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

  function apiError({
    api,
    componentData,
    data,
    performance,
  }: {
    api: ApiRequest
    componentData: ComponentData
    data: {
      body: unknown
      status?: number
      headers?: Record<string, string>
    }
    performance: ApiPerformance
  }) {
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
    const appliedRedirectRule = handleRedirectRules(api, componentData)
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
  async function execute({
    api,
    url,
    requestSettings,
    componentData,
  }: {
    api: ApiRequest
    url: URL
    requestSettings: ToddleRequestInit
    componentData: ComponentData
  }) {
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
              getFormulaContext(api, componentData),
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
        await handleResponse({ api, componentData, res: response, performance })
        return
      } catch (error: any) {
        const body = error.cause
          ? { message: error.message, data: error.cause }
          : error.message
        apiError({
          api,
          componentData,
          data: { body },
          performance: { ...performance, responseEnd: Date.now() },
        })
        triggerActions({
          eventName: 'failed',
          api,
          data: { body },
          componentData,
        })
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
          applyFormula(
            api.client?.debounce?.formula,
            getFormulaContext(api, componentData),
          ),
        )
      })
    }

    return run()
  }

  function handleResponse({
    api,
    componentData,
    res,
    performance,
  }: {
    api: ApiRequest
    componentData: ComponentData
    res: Response
    performance: ApiPerformance
  }) {
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
        return textStreamResponse({ api, componentData, res, performance })
      case 'json':
        return jsonResponse({ api, componentData, res, performance })
      case 'event-stream':
        return eventStreamingResponse({ api, componentData, res, performance })
      case 'json-stream':
        return jsonStreamResponse({ api, componentData, res, performance })
      case 'blob':
        return blobResponse({ api, componentData, res, performance })
      default:
        return textStreamResponse({ api, componentData, res, performance })
    }
  }

  function textStreamResponse({
    api,
    res,
    performance,
    componentData,
  }: {
    api: ApiRequest
    res: Response
    performance: ApiPerformance
    componentData: ComponentData
  }) {
    return handleStreaming({
      api,
      res,
      performance,
      streamType: 'text',
      useTextDecoder: true,
      parseChunk: (chunk) => chunk,
      parseChunksForData: (chunks) => chunks.join(''),
      componentData,
    })
  }

  function jsonStreamResponse({
    api,
    res,
    performance,
    componentData,
  }: {
    api: ApiRequest
    res: Response
    performance: ApiPerformance
    componentData: ComponentData
  }) {
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
      componentData,
    })
  }

  async function jsonResponse({
    api,
    componentData,
    res,
    performance,
  }: {
    api: ApiRequest
    componentData: ComponentData
    res: Response
    performance: ApiPerformance
  }) {
    const body = await res.json()

    const status: ApiStatus = {
      data: body,
      isLoading: false,
      error: null,
      response: {
        status: res.status,
        headers: mapHeadersToObject(res.headers),
      },
    }
    return endResponse({ api, apiStatus: status, componentData, performance })
  }

  async function blobResponse({
    api,
    componentData,
    res,
    performance,
  }: {
    api: ApiRequest
    componentData: ComponentData
    res: Response
    performance: ApiPerformance
  }) {
    const blob = await res.blob()

    const status: ApiStatus = {
      isLoading: false,
      data: URL.createObjectURL(blob),
      error: null,
      response: {
        status: res.status,
        headers: mapHeadersToObject(res.headers),
      },
    }
    return endResponse({ api, apiStatus: status, componentData, performance })
  }

  function eventStreamingResponse({
    api,
    res,
    performance,
    componentData,
  }: {
    api: ApiRequest
    res: Response
    performance: ApiPerformance
    componentData: ComponentData
  }) {
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
      componentData,
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
    delimiters, // There can be various delimiters for the same stream. SSE might use both \n\n and \r\n\r\n,
    componentData,
  }: {
    api: ApiRequest
    res: Response
    performance: ApiPerformance
    streamType: 'json' | 'text' | 'event'
    useTextDecoder: boolean
    parseChunk: (chunk: any) => any
    parseChunksForData: (chunks: any[]) => any
    delimiters?: string[]
    componentData: ComponentData
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
                  headers: mapHeadersToObject(res.headers),
                },
              },
            },
          })
          if ((api.client?.onMessage?.actions ?? []).length > 0) {
            triggerActions({
              eventName: 'message',
              api,
              data: { body: parsedChunk },
              componentData,
            })
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
        headers: mapHeadersToObject(res.headers),
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
    return endResponse({ api, apiStatus: status, componentData, performance })
  }

  function endResponse({
    api,
    apiStatus,
    componentData,
    performance,
  }: {
    api: ApiRequest
    apiStatus: ApiStatus
    componentData: ComponentData
    performance: ApiPerformance
  }) {
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
      formulaContext: getFormulaContext(api, componentData),
      errorFormula: api.isError,
      performance,
    })

    if (isError) {
      if (!data.body && apiStatus.error) {
        data.body = apiStatus.error
      }

      apiError({ api, componentData, data, performance })
      triggerActions({ eventName: 'failed', api, componentData, data })
    } else {
      apiSuccess({ api, componentData, data, performance })
      triggerActions({ eventName: 'success', api, componentData, data })
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
    const payloadContext = getFormulaContext(api, initialComponentData)
    return {
      request: constructRequest(api, initialComponentData),
      api: getApiForComparison(api),
      autoFetch: api.autoFetch
        ? applyFormula(api.autoFetch, payloadContext)
        : false,
      proxy: applyFormula(api.server?.proxy?.enabled.formula, payloadContext),
    }
  })
  payloadSignal.subscribe(async (_) => {
    const { url, requestSettings } = constructRequest(api, initialComponentData)
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
        apiError({
          api,
          data: {
            body: cacheMatch.error,
            status: cacheMatch.response?.status,
            headers: cacheMatch.response?.headers ?? undefined,
          },
          performance: {
            requestStart:
              cacheMatch.response?.performance?.requestStart ?? null,
            responseStart:
              cacheMatch.response?.performance?.responseStart ?? null,
            responseEnd: cacheMatch.response?.performance?.responseEnd ?? null,
          },
          componentData: initialComponentData,
        })
      } else {
        apiSuccess({
          api,
          data: {
            body: cacheMatch.data,
            status: cacheMatch.response?.status,
            headers: cacheMatch.response?.headers ?? undefined,
          },
          performance: {
            requestStart:
              cacheMatch.response?.performance?.requestStart ?? null,
            responseStart:
              cacheMatch.response?.performance?.responseStart ?? null,
            responseEnd: cacheMatch.response?.performance?.responseEnd ?? null,
          },
          componentData: initialComponentData,
        })
      }
    } else {
      if (
        applyFormula(
          api.autoFetch,
          getFormulaContext(api, initialComponentData),
        )
      ) {
        // Execute will set the initial status of the api in the dataSignal
        await execute({
          api,
          url,
          requestSettings,
          componentData: initialComponentData,
        })
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
    fetch: ({ actionInputs, actionModels, componentData }) => {
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

      const { url, requestSettings } = constructRequest(
        apiWithInputsAndActions,
        componentData,
      )

      return execute({
        api: apiWithInputsAndActions,
        url,
        requestSettings,
        componentData,
      })
    },
    update: (newApi, componentData) => {
      api = newApi
      const updateContext = getFormulaContext(api, componentData)
      const autoFetch =
        api.autoFetch && applyFormula(api.autoFetch, updateContext)
      if (autoFetch) {
        payloadSignal?.set({
          request: constructRequest(newApi, componentData),
          api: getApiForComparison(newApi),
          autoFetch,
          proxy: applyFormula(
            newApi.server?.proxy?.enabled.formula,
            updateContext,
          ),
        })
      }
    },
    triggerActions: (componentData) => {
      const apiData = ctx.dataSignal.get().Apis?.[api.name]
      if (
        apiData === undefined ||
        (apiData.data === null && apiData.error === null)
      ) {
        return
      }
      if (apiData.error) {
        triggerActions({
          eventName: 'failed',
          api,
          data: {
            body: apiData.error,
            status: apiData.response?.status,
          },
          componentData,
        })
      } else {
        triggerActions({
          eventName: 'success',
          api,
          data: {
            body: apiData.data,
          },
          componentData,
        })
      }
    },
    destroy: () => payloadSignal?.destroy(),
  }
}
