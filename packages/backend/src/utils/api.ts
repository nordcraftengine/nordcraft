import {
  createApiRequest,
  isApiError,
  requestHash,
  sortApiEntries,
} from '@nordcraft/core/dist/api/api'
import type {
  ApiParserMode,
  ApiPerformance,
  ApiStatus,
  LegacyApiStatus,
  RedirectStatusCode,
} from '@nordcraft/core/dist/api/apiTypes'
import {
  isJsonHeader,
  isTextHeader,
  mapHeadersToObject,
} from '@nordcraft/core/dist/api/headers'
import { ToddleApiV2 } from '@nordcraft/core/dist/api/ToddleApiV2'
import type { FormulaContext } from '@nordcraft/core/dist/formula/formula'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import { easySort } from '@nordcraft/core/dist/utils/collections'
import { validateUrl } from '@nordcraft/core/dist/utils/url'
import { isDefined, toBoolean } from '@nordcraft/core/dist/utils/util'
import type { ApiCache, ApiEvaluator } from '@nordcraft/ssr/dist/rendering/api'
import {
  applyTemplateValues,
  sanitizeProxyHeaders,
} from '@nordcraft/ssr/dist/rendering/template'

export const evaluateComponentApis: ApiEvaluator = async ({
  component,
  formulaContext: _formulaContext,
  req,
  apiCache,
  updateApiCache,
}) => {
  const formulaContext = { ..._formulaContext }

  // We only support v2 APIs in this function
  const sortedApis: [string, ToddleApiV2<string>][] = []
  sortApiEntries(Object.entries(component.apis)).forEach(
    ([key, api]) => api instanceof ToddleApiV2 && sortedApis.push([key, api]),
  )

  // Sort APIs to improve the chance of APIs depending on each other being fetched in the correct order
  const independentApiResponses: Record<string, ApiStatus> = Object.fromEntries(
    await Promise.all(
      // Evaluate independent API requests in parallel
      sortedApis
        .filter(([_, api]) => api.apiReferences.size === 0)
        .map(async ([name, api]) => {
          const { response, cacheKey } = await fetchApi({
            api,
            formulaContext,
            req,
            apiCache,
            componentName: component.name,
          })
          if (isDefined(cacheKey)) {
            updateApiCache(String(cacheKey), response)
          }
          return [name, response]
        }),
    ),
  )
  formulaContext.data.Apis = {
    ...formulaContext.data.Apis,
    ...independentApiResponses,
  }
  const dependentApis = sortedApis.filter(
    ([_, api]) => api.apiReferences.size > 0,
  )
  const dependentApiResponses: Record<string, LegacyApiStatus | ApiStatus> = {}
  for (const [_, api] of dependentApis) {
    // Fetch dependent APIs sequentially
    const { response, cacheKey } = await fetchApi({
      api,
      formulaContext,
      req,
      apiCache,
      componentName: component.name,
    })
    dependentApiResponses[api.name] = response
    formulaContext.data.Apis = {
      ...formulaContext.data.Apis,
      [api.name]: response,
    }
    if (isDefined(cacheKey)) {
      updateApiCache(String(cacheKey), response)
    }
  }
  return {
    ...independentApiResponses,
    ...dependentApiResponses,
  }
}

const fetchApi = async ({
  api,
  formulaContext,
  req,
  apiCache,
  componentName,
}: {
  api: ToddleApiV2<string>
  formulaContext: FormulaContext
  req: Request
  apiCache?: ApiCache
  componentName: string
}): Promise<{
  response: LegacyApiStatus | ApiStatus
  cacheKey?: number
}> => {
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

  const newFormulaContext: FormulaContext = {
    component: formulaContext.component,
    package: formulaContext.package,
    data,
    env: formulaContext.env,
    toddle: formulaContext.toddle,
  }

  const ssrEnabled = isDefined(api.server?.ssr?.enabled)
    ? toBoolean(
        applyFormula(api.server?.ssr?.enabled.formula, newFormulaContext),
      )
    : false

  const autoFetch = isDefined(api.autoFetch)
    ? toBoolean(applyFormula(api.autoFetch, newFormulaContext))
    : false

  if (!ssrEnabled || !autoFetch) {
    // Return early if the API is not enabled for SSR or autoFetch is disabled
    return {
      response: {
        data: null,
        isLoading: autoFetch,
        error: null,
      },
    }
  }

  const url = new URL(req.url)
  const { url: requestUrl, requestSettings } = createApiRequest({
    api,
    formulaContext,
    baseUrl: url.origin,
    defaultHeaders: new Headers({
      ...mapHeadersToObject(req.headers),
      // Override accept + accept-encoding to increase the chance that we can work with the response
      // from an API fetched during SSR. Many servers don't support br encoding for instance.
      accept: '*/*',
      'accept-encoding': 'gzip, deflate',
    }),
  })
  const cacheKey = requestHash(requestUrl, requestSettings)

  if (apiCache?.[cacheKey]) {
    // Return early if the response is already cached
    return { response: apiCache[cacheKey] }
  }

  // Override potentially encoded cookies in url
  requestUrl.searchParams.forEach((value, key) => {
    requestUrl.searchParams.set(
      key,
      applyTemplateValues(value, newFormulaContext.env?.request?.cookies ?? {}),
    )
  })

  const request = new Request(requestUrl.href, {
    ...requestSettings,
    headers: sanitizeProxyHeaders({
      cookies: newFormulaContext.env?.request?.cookies ?? {},
      headers: requestSettings.headers,
    }),
  })

  const response = await fetchApiV2({
    api,
    formulaContext: newFormulaContext,
    req: request,
    originalRequest: req,
    componentName,
  })

  return { response, cacheKey }
}

const fetchApiV2 = async ({
  api,
  formulaContext,
  req,
  originalRequest,
  componentName,
}: {
  api: ToddleApiV2<string>
  formulaContext: FormulaContext
  req: Request
  originalRequest: Request
  componentName: string
}): Promise<ApiStatus> => {
  let isError = false
  let response: Response
  const performance: ApiPerformance = {
    requestStart: Date.now(),
    responseStart: null,
    responseEnd: null,
  }
  try {
    response = await executeFetchCall(req)
  } catch (e) {
    return {
      data: null,
      isLoading: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
  let responseBody: unknown
  try {
    performance.responseStart = Date.now()
    responseBody = await getBody(response, api.client?.parserMode)
    performance.responseEnd = Date.now()
  } catch (e: any) {
    return {
      data: null,
      isLoading: false,
      error: `Error getting response body: ${e}`,
      response: {
        status: 500,
        headers: mapHeadersToObject(response.headers),
      },
    }
  }
  // Figure out if the response should be treated as an error
  const errorFormula = api.isError
  isError = isApiError({
    apiName: api.name,
    response: {
      body: responseBody,
      ok: response.ok,
      status: response.status,
      headers: mapHeadersToObject(response.headers),
    },
    formulaContext,
    errorFormula,
    performance,
  })

  const apiStatus: ApiStatus = {
    data: isError ? null : responseBody,
    isLoading: false,
    error: isError ? (responseBody ?? response.statusText) : null,
    response: {
      status: response.status,
      headers: mapHeadersToObject(response.headers),
      performance,
    },
  }
  // Check for redirects
  const originalRequestUrl = new URL(originalRequest.url)
  easySort(
    Object.values(api.redirectRules ?? {}),
    (rule) => rule.index,
  ).forEach((rule) => {
    const location = applyFormula(rule.formula, {
      ...formulaContext,
      data: {
        ...formulaContext.data,
        Apis: {
          [api.name]: apiStatus,
        },
      },
    })
    if (typeof location === 'string') {
      const url = validateUrl({
        path: location,
        origin: originalRequestUrl.origin,
      })
      if (url) {
        // Opt out early to avoid additional API requests/rendering
        throw new RedirectError({
          url,
          statusCode:
            typeof rule.statusCode === 'number' ? rule.statusCode : undefined,
          componentName,
          apiName: api.name,
        })
      }
    }
  })
  return apiStatus
}

const getBody = (res: Response, parserOverride: ApiParserMode = 'auto') => {
  if (parserOverride !== 'auto') {
    if (parserOverride === 'json') {
      return res.json()
    } else if (parserOverride === 'text') {
      return res.text()
    }
    throw new Error(`Unsupported SSR API parser override: ${parserOverride}`)
  }
  const contentType = res.headers.get('content-type')
  if (isJsonHeader(contentType)) {
    return res.json()
  } else if (isTextHeader(contentType)) {
    return res.text()
  }
  throw new Error(`Unsupported SSR API content type: ${contentType}`)
}

export class RedirectError extends Error {
  constructor(
    public readonly redirect: {
      apiName: string
      componentName: string
      url: URL
      statusCode?: RedirectStatusCode
    },
  ) {
    super()
  }
}

const executeFetchCall = async (request: Request) => {
  try {
    // Remove the cf-connecting-ip header if the request is from localhost
    // This is to prevent cf to throw an error when the requester ip is ::1
    if ((request.headers.get('host') ?? '').startsWith('localhost')) {
      request.headers.delete('cf-connecting-ip')
    }
    const response = await fetch(request)
    return response
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.log('API request threw error', e.message)
    const status = e instanceof Error && e.name === 'TimeoutError' ? 504 : 500
    return Response.json(e.message, { status })
  }
}
