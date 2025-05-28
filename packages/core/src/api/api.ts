import type { Formula, FormulaContext } from '../formula/formula'
import { applyFormula } from '../formula/formula'
import { omitKeys, sortObjectEntries } from '../utils/collections'
import { hash } from '../utils/hash'
import { isDefined, isObject, toBoolean } from '../utils/util'
import type {
  ApiBase,
  ApiPerformance,
  ApiRequest,
  ComponentAPI,
  LegacyComponentAPI,
  ToddleRequestInit,
} from './apiTypes'
import { ApiMethod } from './apiTypes'
import { LegacyToddleApi } from './LegacyToddleApi'
import { ToddleApiV2 } from './ToddleApiV2'

export const NON_BODY_RESPONSE_CODES = [101, 204, 205, 304]

export const isLegacyApi = <Handler>(
  api: ComponentAPI | LegacyToddleApi<Handler> | ToddleApiV2<Handler>,
): api is LegacyComponentAPI | LegacyToddleApi<Handler> =>
  api instanceof LegacyToddleApi ? true : !('version' in api)

export const createApiRequest = <Handler>({
  api,
  formulaContext,
  baseUrl,
  defaultHeaders,
}: {
  api: ApiRequest | ToddleApiV2<Handler>
  formulaContext: FormulaContext
  baseUrl?: string
  defaultHeaders: Headers | undefined
}) => {
  const url = getUrl(api, formulaContext, baseUrl)
  const requestSettings = getRequestSettings({
    api,
    formulaContext,
    defaultHeaders,
  })

  return { url, requestSettings }
}

export const getUrl = (
  api: ApiBase,
  formulaContext: FormulaContext,
  baseUrl?: string,
): URL => {
  let urlPathname = ''
  let urlQueryParams = new URLSearchParams()
  let parsedUrl: URL | undefined
  const url = applyFormula(api.url, formulaContext)
  if (['string', 'number'].includes(typeof url)) {
    const urlInput = typeof url === 'number' ? String(url) : url
    try {
      // Try to parse the URL to extract potential path and query parameters
      parsedUrl = new URL(urlInput, baseUrl)
      urlPathname = parsedUrl.pathname
      urlQueryParams = parsedUrl.searchParams
      // eslint-disable-next-line no-empty
    } catch {}
  }
  const pathParams = getRequestPath(api.path, formulaContext)
  // Combine potential path parameters from the url declaration with the actual path parameters
  const path = `${urlPathname}${pathParams.length > 0 && !urlPathname.endsWith('/') ? '/' : ''}${pathParams}`
  // Combine potential query parameters from the url declaration with the actual query parameters
  const queryParams = new URLSearchParams([
    ...urlQueryParams,
    ...getRequestQueryParams(api.queryParams, formulaContext),
  ])
  const queryString =
    [...queryParams.entries()].length > 0 ? `?${queryParams.toString()}` : ''
  const hash = applyFormula(api.hash?.formula, formulaContext)
  const hashString =
    typeof hash === 'string' && hash.length > 0 ? `#${hash}` : ''
  if (parsedUrl) {
    const combinedUrl = new URL(parsedUrl.origin, baseUrl)
    combinedUrl.pathname = path
    combinedUrl.search = queryParams.toString()
    combinedUrl.hash = hashString
    return combinedUrl
  } else {
    return new URL(`${path}${queryString}${hashString}`, baseUrl)
  }
}

const HttpMethodsWithAllowedBody: ApiMethod[] = [
  ApiMethod.POST,
  ApiMethod.DELETE,
  ApiMethod.PUT,
  ApiMethod.PATCH,
  ApiMethod.OPTIONS,
]

export const applyAbortSignal = (
  api: ApiRequest,
  requestSettings: RequestInit,
  formulaContext: FormulaContext,
) => {
  if (api.timeout) {
    const timeout = applyFormula(api.timeout.formula, formulaContext)
    if (typeof timeout === 'number' && !Number.isNaN(timeout) && timeout > 0) {
      requestSettings.signal = AbortSignal.timeout(timeout)
    }
  }
}

const getRequestSettings = ({
  api,
  formulaContext,
  defaultHeaders,
}: {
  api: ApiRequest
  formulaContext: FormulaContext
  defaultHeaders: Headers | undefined
}): ToddleRequestInit => {
  const method = Object.values(ApiMethod).includes(api.method as ApiMethod)
    ? (api.method as ApiMethod)
    : ApiMethod.GET
  const headers = getRequestHeaders({
    apiHeaders: api.headers,
    formulaContext,
    defaultHeaders,
  })
  const body = getRequestBody({ api, formulaContext, headers, method })
  if (headers.get('content-type') === 'multipart/form-data') {
    headers.delete('content-type')
  }

  const requestSettings: ToddleRequestInit = {
    method,
    headers,
    body,
  }

  applyAbortSignal(api, requestSettings, formulaContext)

  return requestSettings
}

export const getRequestPath = (
  path: ApiRequest['path'],
  formulaContext: FormulaContext,
): string =>
  sortObjectEntries(path ?? {}, ([_, p]) => p.index)
    .map(([_, p]) => applyFormula(p.formula, formulaContext))
    .join('/')

export const getRequestQueryParams = (
  params: ApiRequest['queryParams'],
  formulaContext: FormulaContext,
): URLSearchParams => {
  const queryParams = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, param]) => {
    const enabled = isDefined(param.enabled)
      ? applyFormula(param.enabled, formulaContext)
      : true
    if (!enabled) {
      return
    }

    const value = applyFormula(param.formula, formulaContext)
    if (!isDefined(value)) {
      // Ignore null/undefined values
      return
    }
    if (Array.isArray(value)) {
      // Support encoding 1-dimensional arrays
      value.forEach((v) => queryParams.append(key, String(v)))
    } else if (isObject(value)) {
      // Support encoding (nested) objects, but cast any non-object to a String
      const encodeObject = (obj: Record<string, any>, prefix: string) => {
        Object.entries(obj).forEach(([key, val]) => {
          if (!Array.isArray(val) && isObject(val)) {
            return encodeObject(val, `${prefix}[${key}]`)
          } else {
            queryParams.set(`${prefix}[${key}]`, String(val))
          }
        })
      }
      encodeObject(value, key)
    } else {
      queryParams.set(key, String(value))
    }
  })
  return queryParams
}

export const getRequestHeaders = ({
  apiHeaders,
  formulaContext,
  defaultHeaders,
}: {
  apiHeaders: ApiRequest['headers']
  formulaContext: FormulaContext
  defaultHeaders: Headers | undefined
}) => {
  const headers = new Headers(defaultHeaders)
  Object.entries(apiHeaders ?? {}).forEach(([key, param]) => {
    const enabled = isDefined(param.enabled)
      ? applyFormula(param.enabled, formulaContext)
      : true
    if (enabled) {
      const value = applyFormula(param.formula, formulaContext)
      if (isDefined(value)) {
        try {
          headers.set(
            key.trim(),
            (typeof value === 'string' ? value : String(value)).trim(),
          )
          // eslint-disable-next-line no-empty
        } catch {}
      }
    }
  })
  return headers
}

export const getBaseUrl = ({
  origin,
  url,
}: {
  origin: string
  url?: string
}) =>
  !isDefined(url) || url === '' || url.startsWith('/') ? origin + url : url

/**
 * Calculate the hash of a Request object based on its properties
 */
export const requestHash = (url: URL, request: RequestInit) =>
  hash(
    JSON.stringify({
      url: url.href,
      method: request.method,
      headers: omitKeys(
        Object.fromEntries(Object.entries(request.headers ?? {})),
        ['host', 'cookie'],
      ),
      body: request.body ?? null,
    }),
  )

export const isApiError = ({
  apiName,
  response,
  formulaContext,
  errorFormula,
  performance,
}: {
  apiName: string
  response: {
    ok: boolean
    status?: number
    headers?: Record<string, string> | null
    body: unknown
  }
  formulaContext: FormulaContext
  performance: ApiPerformance
  errorFormula?: { formula: Formula } | null
}) => {
  const errorFormulaRes = errorFormula
    ? applyFormula(errorFormula.formula, {
        component: formulaContext.component,
        package: formulaContext.package,
        toddle: formulaContext.toddle,
        data: {
          Attributes: {},
          Args: formulaContext.data.Args,
          Apis: {
            // The errorFormula will only have access to the data of the current API
            [apiName]: {
              isLoading: false,
              data: response.body,
              error: null,
              response: {
                status: response.status,
                headers: response.headers,
                performance,
              },
            },
          },
        },
        env: formulaContext.env,
      })
    : null

  if (errorFormulaRes === null || errorFormulaRes === undefined) {
    return !response.ok
  }
  return toBoolean(errorFormulaRes)
}

const getRequestBody = ({
  api,
  formulaContext,
  headers,
  method,
}: {
  api: ApiRequest
  formulaContext: FormulaContext
  headers: Headers
  method: ApiMethod
}): FormData | string | undefined => {
  if (!api.body || !HttpMethodsWithAllowedBody.includes(method)) {
    return
  }

  const body = applyFormula(api.body, formulaContext)
  if (!body) {
    return
  }
  switch (headers.get('content-type')) {
    case 'application/x-www-form-urlencoded': {
      if (typeof body === 'object' && body !== null) {
        return Object.entries(body)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return value
                .map(
                  (v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`,
                )
                .join('&')
            } else {
              return `${encodeURIComponent(key)}=${encodeURIComponent(
                String(value),
              )}`
            }
          })
          .join('&')
      }
      return ''
    }
    case 'multipart/form-data': {
      const formData = new FormData()
      if (typeof body === 'object' && body !== null) {
        Object.entries(body).forEach(([key, value]) => {
          formData.set(key, value as string | Blob)
        })
      }
      return formData
    }
    case 'text/plain':
      return String(body)
    default:
      return JSON.stringify(body)
  }
}

export const createApiEvent = (
  eventName: 'message' | 'success' | 'failed',
  detail: any,
) => {
  return new CustomEvent(eventName, {
    detail,
  })
}

const compareApiDependencies = <Handler>(
  a: LegacyToddleApi<Handler> | ToddleApiV2<Handler>,
  b: LegacyToddleApi<Handler> | ToddleApiV2<Handler>,
) => {
  const isADependentOnB = a.apiReferences.has(b.name)
  const isBDependentOnA = b.apiReferences.has(a.name)
  if (isADependentOnB === isBDependentOnA) {
    return 0
  }
  // 1 means A goes last - hence B is evaluated before A
  return isADependentOnB ? 1 : -1
}

export const sortApiObjects = <Handler>(
  apis: Array<[string, ComponentAPI]>,
) => {
  const apiMap = new Map<
    string,
    LegacyToddleApi<Handler> | ToddleApiV2<Handler>
  >()
  const getApi = (apiObj: ComponentAPI, key: string) => {
    let api = apiMap.get(key)
    if (!api) {
      api =
        apiObj.version === 2
          ? new ToddleApiV2<Handler>(
              apiObj,
              key,
              // global formulas are not required for sorting
              {
                formulas: {},
                packages: {},
              },
            )
          : new LegacyToddleApi<Handler>(
              apiObj,
              key,
              // global formulas are not required for sorting
              {
                formulas: {},
                packages: {},
              },
            )
      apiMap.set(key, api)
    }
    return api
  }

  return [...apis].sort(([aKey, aObj], [bKey, bObj]) => {
    const a = getApi(aObj, aKey)
    const b = getApi(bObj, bKey)
    return compareApiDependencies(a, b)
  })
}

export const sortApiEntries = <Handler>(
  apis: Array<[string, LegacyToddleApi<Handler> | ToddleApiV2<Handler>]>,
) => [...apis].sort(([_, a], [__, b]) => compareApiDependencies(a, b))
