/* eslint-disable max-params */
import '../compileTime'
import type { ComponentData } from '../component/component.types'
import type { Formula, FormulaContext } from '../formula/formula'
import { applyFormula } from '../formula/formula'
import type { Nullable } from '../types'
import { sortObjectEntries } from '../utils/collections'
import { hash } from '../utils/hash'
import { isDefined, isObject, toBoolean } from '../utils/util'
import type {
  ApiBase,
  ApiPerformance,
  ApiRequest,
  ToddleRequestInit,
} from './apiTypes'
import { ApiMethod } from './apiTypes'
import { isJsonHeader } from './headers'
import type { ToddleApiV2 } from './ToddleApiV2'

export const NON_BODY_RESPONSE_CODES = [101, 204, 205, 304]

export const createApiRequest = <Handler>({
  api,
  formulaContext,
  data,
  baseUrl,
}: {
  api: ApiRequest | ToddleApiV2<Handler>
  formulaContext: FormulaContext
  data: ComponentData
  baseUrl?: Nullable<string>
}) => {
  const url = getUrl(
    api,
    IS_PREVIEW && formulaContext.reportFormulaEvaluation
      ? { ...formulaContext, jsonPath: ['apis', api.name] }
      : formulaContext,
    data,
    baseUrl,
  )
  const requestSettings = getRequestSettings({
    api,
    formulaContext,
    data,
  })

  return { url, requestSettings }
}

export const getUrl = (
  api: ApiBase,
  formulaContext: FormulaContext,
  data: ComponentData,
  baseUrl?: Nullable<string>,
): URL => {
  let urlPathname = ''
  let urlQueryParams = new URLSearchParams()
  let parsedUrl: URL | undefined
  const url = applyFormula(
    api.url,
    formulaContext,
    data,
    IS_PREVIEW ? ['url'] : undefined,
  )
  if (['string', 'number'].includes(typeof url)) {
    const urlInput = typeof url === 'number' ? String(url) : url
    try {
      // Try to parse the URL to extract potential path and query parameters
      parsedUrl = new URL(urlInput, baseUrl ?? undefined)
      urlPathname = parsedUrl.pathname
      urlQueryParams = parsedUrl.searchParams
      // eslint-disable-next-line no-empty
    } catch {}
  }
  const pathParams = getRequestPath(api.path, formulaContext, data)
  // Combine potential path parameters from the url declaration with the actual path parameters
  const path = `${urlPathname}${pathParams.length > 0 && !urlPathname.endsWith('/') ? '/' : ''}${pathParams}`
  // Combine potential query parameters from the url declaration with the actual query parameters
  const queryParams = new URLSearchParams([
    ...urlQueryParams,
    ...getRequestQueryParams(api.queryParams, formulaContext, data),
  ])
  const queryString =
    [...queryParams.entries()].length > 0 ? `?${queryParams.toString()}` : ''
  const hash = applyFormula(
    api.hash?.formula,
    formulaContext,
    data,
    IS_PREVIEW ? ['hash', 'formula'] : undefined,
  )
  const hashString =
    typeof hash === 'string' && hash.length > 0 ? `#${hash}` : ''
  if (parsedUrl) {
    const combinedUrl = new URL(parsedUrl.origin, baseUrl ?? undefined)
    combinedUrl.pathname = path
    combinedUrl.search = queryParams.toString()
    combinedUrl.hash = hashString
    return combinedUrl
  } else {
    return new URL(`${path}${queryString}${hashString}`, baseUrl ?? undefined)
  }
}

export const HttpMethodsWithAllowedBody: ApiMethod[] = [
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
  data: ComponentData,
) => {
  if (api.timeout) {
    const timeout = applyFormula(
      api.timeout.formula,
      formulaContext,
      data,
      IS_PREVIEW ? ['timeout', 'formula'] : undefined,
    )
    if (typeof timeout === 'number' && !Number.isNaN(timeout) && timeout > 0) {
      requestSettings.signal = AbortSignal.timeout(timeout)
    }
  }
}

const getRequestSettings = ({
  api,
  formulaContext,
  data,
}: {
  api: ApiRequest
  formulaContext: FormulaContext
  data: ComponentData
}): ToddleRequestInit => {
  const method = Object.values(ApiMethod).includes(api.method as ApiMethod)
    ? (api.method as ApiMethod)
    : ApiMethod.GET
  const headers = getRequestHeaders({
    apiHeaders: api.headers,
    formulaContext,
    data,
  })
  const body = getRequestBody({ api, formulaContext, data, headers, method })
  if (headers.get('content-type') === 'multipart/form-data') {
    headers.delete('content-type')
  }

  const requestSettings: ToddleRequestInit = {
    method,
    headers,
    body,
  }

  applyAbortSignal(api, requestSettings, formulaContext, data)

  return requestSettings
}

export const getRequestPath = (
  path: ApiRequest['path'],
  formulaContext: FormulaContext,
  data: ComponentData,
): string =>
  sortObjectEntries(path ?? {}, ([_, p]) => p.index)
    .map(([parameterName, p]) =>
      applyFormula(
        p.formula,
        formulaContext,
        data,
        IS_PREVIEW ? ['path', parameterName] : undefined,
      ),
    )
    .join('/')

export const getRequestQueryParams = (
  params: ApiRequest['queryParams'],
  formulaContext: FormulaContext,
  data: ComponentData,
): URLSearchParams => {
  const queryParams = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, param]) => {
    const enabled = isDefined(param.enabled)
      ? applyFormula(
          param.enabled,
          formulaContext,
          data,
          IS_PREVIEW ? ['queryParams', key, 'enabled'] : undefined,
        )
      : true
    if (!enabled) {
      return
    }

    const value = applyFormula(
      param.formula,
      formulaContext,
      data,
      IS_PREVIEW ? ['queryParams', key, 'formula'] : undefined,
    )
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
  data,
}: {
  apiHeaders: ApiRequest['headers']
  formulaContext: FormulaContext
  data: ComponentData
}) => {
  const headers = new Headers()
  Object.entries(apiHeaders ?? {}).forEach(([key, param]) => {
    const enabled = isDefined(param.enabled)
      ? applyFormula(
          param.enabled,
          formulaContext,
          data,
          IS_PREVIEW ? ['headers', key, 'enabled'] : undefined,
        )
      : true
    if (enabled) {
      const value = applyFormula(
        param.formula,
        formulaContext,
        data,
        IS_PREVIEW ? ['headers', key, 'formula'] : undefined,
      )
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
  url?: Nullable<string>
}) =>
  !isDefined(url) || url === '' || url.startsWith('/') ? origin + url : url

/**
 * Calculate the hash of a Request object based on its properties
 */
export const requestHash = (url: URL, request: RequestInit) => {
  let headers: Record<string, string> | undefined
  if (request.headers) {
    const _headers = new Headers(request.headers)
    _headers.delete('host')
    _headers.delete('cookie')
    const headerEntries = Object.fromEntries(_headers.entries())
    if (Object.keys(headerEntries).length > 0) {
      headers = headerEntries
    }
  }
  return hash(
    JSON.stringify({
      url: url.href,
      method: request.method,
      headers,
      body: request.body ?? null,
    }),
  )
}

export const isApiError = ({
  apiName,
  response,
  formulaContext,
  data,
  errorFormula,
  performance,
}: {
  apiName: string
  response: {
    ok: boolean
    status?: Nullable<number>
    headers?: Nullable<Record<string, string>>
    body: unknown
  }
  formulaContext: FormulaContext
  data: ComponentData
  performance: ApiPerformance
  errorFormula?: Nullable<{ formula: Formula }>
}) => {
  const errorFormulaRes = errorFormula
    ? applyFormula(
        errorFormula.formula,
        IS_PREVIEW && formulaContext.reportFormulaEvaluation
          ? {
              ...formulaContext,
              jsonPath: ['apis', apiName, 'isError', 'formula'],
            }
          : formulaContext,
        {
          Args: data.Args,
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
      )
    : null

  if (errorFormulaRes === null || errorFormulaRes === undefined) {
    return !response.ok
  }
  return toBoolean(errorFormulaRes)
}

export const getRequestBody = ({
  api,
  formulaContext,
  data,
  headers,
  method,
}: {
  api: ApiRequest
  formulaContext: FormulaContext
  data: ComponentData
  headers: Headers
  method: ApiMethod
}): FormData | string | undefined => {
  if (!api.body || !HttpMethodsWithAllowedBody.includes(method)) {
    return
  }

  const body = applyFormula(
    api.body,
    formulaContext,
    data,
    IS_PREVIEW ? ['body'] : undefined,
  )
  if (!body) {
    return
  }
  const contentType = headers.get('content-type')
  if (!isDefined(contentType) || isJsonHeader(contentType)) {
    // JSON.stringify the body if the content type is JSON or has not been set
    return JSON.stringify(body)
  }
  switch (contentType) {
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
      if (typeof body === 'object' && body !== null) {
        return toFormData(body)
      } else {
        return new FormData()
      }
    }
    case 'text/plain':
      return String(body)
    default:
      // For other content types, we return the body as is
      return body
  }
}

/**
 * Converts a plain object to FormData, supporting nested objects and arrays.
 */
export const toFormData = (body: Record<string, unknown>): FormData => {
  const formData = new FormData()
  for (const [key, value] of Object.entries(body)) {
    if (value === null || value === undefined) {
      continue
    }
    const values = Array.isArray(value) ? value : [value]
    for (const v of values) {
      if (v === null || v === undefined) {
        continue
      }
      if (v instanceof File) {
        formData.append(key, v, v.name)
      } else if (v instanceof Blob) {
        formData.append(key, v)
      } else if (['string', 'number', 'boolean'].includes(typeof v)) {
        formData.append(key, String(v))
      } else if (typeof v === 'object') {
        formData.append(key, JSON.stringify(v))
      } else {
        // Unsupported value type
        continue
      }
    }
  }
  return formData
}

export const createApiEvent = (
  eventName: 'message' | 'success' | 'failed',
  detail: any,
) => {
  return new CustomEvent(eventName, {
    detail,
  })
}
