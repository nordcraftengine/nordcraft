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
import type { NestedOmit, Nullable } from '@nordcraft/core/dist/types'
import {
  omitPaths,
  sortObjectEntries,
} from '@nordcraft/core/dist/utils/collections'
import {
  PROXY_TEMPLATES_IN_BODY,
  PROXY_URL_HEADER,
  validateUrl,
} from '@nordcraft/core/dist/utils/url'
import { isDefined, toBoolean } from '@nordcraft/core/dist/utils/util'
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
    workflowCallback,
  }: {
    eventName: 'message' | 'success' | 'failed'
    api: ApiRequest
    data: {
      body: unknown
      status?: Nullable<number>
      headers?: Nullable<Record<string, string>>
    }
    componentData: ComponentData
    workflowCallback?: (event: string, data: unknown) => void
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
            workflowCallback,
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
            workflowCallback,
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
            workflowCallback,
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
      status?: Nullable<number>
      headers?: Nullable<Record<string, string>>
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
      status?: Nullable<number>
      headers?: Nullable<Record<string, string>>
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
    workflowCallback,
  }: {
    api: ApiRequest
    url: URL
    requestSettings: ToddleRequestInit
    componentData: ComponentData
    workflowCallback?: (event: string, data: unknown) => void
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
          const allowBodyTemplateValues = toBoolean(
            applyFormula(
              api.server?.proxy?.useTemplatesInBody?.formula,
              getFormulaContext(api, componentData),
            ),
          )
          if (allowBodyTemplateValues) {
            headers.set(PROXY_TEMPLATES_IN_BODY, 'true')
          }
          requestSettings.headers = headers
          response = await fetch(proxyUrl, requestSettings)
        }

        performance.responseStart = Date.now()
        await handleResponse({
          api,
          componentData,
          res: response,
          performance,
          workflowCallback,
        })
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
          workflowCallback,
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
    workflowCallback,
  }: {
    api: ApiRequest
    componentData: ComponentData
    res: Response
    performance: ApiPerformance
    workflowCallback?: (event: string, data: unknown) => void
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
        return textStreamResponse({
          api,
          componentData,
          res,
          performance,
          workflowCallback,
        })
      case 'json':
        return jsonResponse({
          api,
          componentData,
          res,
          performance,
          workflowCallback,
        })
      case 'event-stream':
        return eventStreamingResponse({
          api,
          componentData,
          res,
          performance,
          workflowCallback,
        })
      case 'json-stream':
        return jsonStreamResponse({
          api,
          componentData,
          res,
          performance,
          workflowCallback,
        })
      case 'blob':
        return blobResponse({
          api,
          componentData,
          res,
          performance,
          workflowCallback,
        })
      default:
        return textStreamResponse({
          api,
          componentData,
          res,
          performance,
          workflowCallback,
        })
    }
  }

  function textStreamResponse({
    api,
    res,
    performance,
    componentData,
    workflowCallback,
  }: {
    api: ApiRequest
    res: Response
    performance: ApiPerformance
    componentData: ComponentData
    workflowCallback?: (event: string, data: unknown) => void
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
      workflowCallback,
    })
  }

  function jsonStreamResponse({
    api,
    res,
    performance,
    componentData,
    workflowCallback,
  }: {
    api: ApiRequest
    res: Response
    performance: ApiPerformance
    componentData: ComponentData
    workflowCallback?: (event: string, data: unknown) => void
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
      workflowCallback,
    })
  }

  async function jsonResponse({
    api,
    componentData,
    res,
    performance,
    workflowCallback,
  }: {
    api: ApiRequest
    componentData: ComponentData
    res: Response
    performance: ApiPerformance
    workflowCallback?: (event: string, data: unknown) => void
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
    return endResponse({
      api,
      apiStatus: status,
      componentData,
      performance,
      workflowCallback,
    })
  }

  async function blobResponse({
    api,
    componentData,
    res,
    performance,
    workflowCallback,
  }: {
    api: ApiRequest
    componentData: ComponentData
    res: Response
    performance: ApiPerformance
    workflowCallback?: (event: string, data: unknown) => void
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
    return endResponse({
      api,
      apiStatus: status,
      componentData,
      performance,
      workflowCallback,
    })
  }

  function eventStreamingResponse({
    api,
    res,
    performance,
    componentData,
    workflowCallback,
  }: {
    api: ApiRequest
    res: Response
    performance: ApiPerformance
    componentData: ComponentData
    workflowCallback?: (event: string, data: unknown) => void
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
      workflowCallback,
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
    workflowCallback,
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
    workflowCallback?: (event: string, data: unknown) => void
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
              workflowCallback,
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
    return endResponse({
      api,
      apiStatus: status,
      componentData,
      performance,
      workflowCallback,
    })
  }

  function endResponse({
    api,
    apiStatus,
    componentData,
    performance,
    workflowCallback,
  }: {
    api: ApiRequest
    apiStatus: ApiStatus
    componentData: ComponentData
    performance: ApiPerformance
    workflowCallback?: (event: string, data: unknown) => void
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
      triggerActions({
        eventName: 'failed',
        api,
        componentData,
        data,
        workflowCallback,
      })
    } else {
      apiSuccess({ api, componentData, data, performance })
      triggerActions({
        eventName: 'success',
        api,
        componentData,
        data,
        workflowCallback,
      })
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
        headers: Array<[string, string]>
        // if the evaluated value of autoFetch changes from false -> true, we need to refetch the api
        autoFetch: boolean
        // currently, the proxy setting is always controlled by a "value formula", but in case we later
        // open up for controlling it with a dynamic formula, we should also include it here
        proxy: boolean
      }>
    | undefined

  // eslint-disable-next-line prefer-const
  payloadSignal = ctx.dataSignal.map((data) => {
    const payloadContext = getFormulaContext(api, data)
    const request = constructRequest(api, data)
    return {
      request,
      api: getApiForComparison(api),
      // Serialize the Headers object to be able to compare changes
      headers: Array.from(request.requestSettings.headers.entries()),
      autoFetch: api.autoFetch
        ? applyFormula(api.autoFetch, payloadContext)
        : false,
      proxy: applyFormula(api.server?.proxy?.enabled.formula, payloadContext),
    }
  })
  payloadSignal.subscribe(async (apiData) => {
    const { url, requestSettings } = apiData.request
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
      } else if (!ctx.dataSignal.get().Apis?.[api.name]) {
        // If the api is not set in the dataSignal, we need to initialize it.
        // If it is set and autoFetch is false, we do not want to reset it.
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
      componentData,
      workflowCallback,
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

      const { url, requestSettings } = constructRequest(
        apiWithInputsAndActions,
        componentData,
      )

      return execute({
        api: apiWithInputsAndActions,
        url,
        requestSettings,
        componentData,
        workflowCallback,
      })
    },
    update: (newApi, componentData) => {
      api = newApi
      const updateContext = getFormulaContext(api, componentData)
      const autoFetch =
        api.autoFetch && applyFormula(api.autoFetch, updateContext)
      if (autoFetch) {
        const request = constructRequest(newApi, componentData)
        payloadSignal?.set({
          request,
          api: getApiForComparison(newApi),
          autoFetch,
          proxy: applyFormula(
            newApi.server?.proxy?.enabled.formula,
            updateContext,
          ),
          // Serialize the Headers object to be able to compare changes
          headers: Array.from(request.requestSettings.headers.entries()),
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
