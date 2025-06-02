/* eslint-disable @typescript-eslint/no-floating-promises */
import type { LegacyComponentAPI } from '@nordcraft/core/dist/api/apiTypes'
import { mapHeadersToObject } from '@nordcraft/core/dist/api/headers'
import type { ComponentData } from '@nordcraft/core/dist/component/component.types'
import { applyFormula, isFormula } from '@nordcraft/core/dist/formula/formula'
import { mapValues } from '@nordcraft/core/dist/utils/collections'
import { parseJSONWithDate } from '@nordcraft/core/dist/utils/json'
import { handleAction } from '../events/handleAction'
import type { Signal } from '../signal/signal'
import type { ComponentContext } from '../types'

export type ApiRequest = {
  url: string
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'OPTION' | 'HEAD'
  auth: { type: string } | undefined
  headers: Record<string, string>
  body: any
}

/**
 * Set up an api for a component.
 * API requests are either proxied through toddle's back-end
 * or sent directly to the api endpoint (when api.proxy === false)
 */
export function createLegacyAPI(
  api: LegacyComponentAPI,
  ctx: ComponentContext,
) {
  let timer: any = null

  // Create the payload we send to toddle's back-end
  // This includes url, headers, and content, sent in the body of a post request to /_query/<ComponentName>.<QueryName>
  function constructPayload(
    api: LegacyComponentAPI,
    data: ComponentData,
  ): ApiRequest {
    const formulaContext = {
      data,
      component: ctx.component,
      formulaCache: ctx.formulaCache,
      root: ctx.root,
      package: ctx.package,
      toddle: ctx.toddle,
      env: ctx.env,
    }

    // construct the url
    const baseUrl = applyFormula(api.url, formulaContext) ?? ''
    const urlPath =
      api.path && api.path.length > 0
        ? '/' +
          api.path.map((p) => applyFormula(p.formula, formulaContext)).join('/')
        : ''

    // build querystring
    const queryParams = Object.values(api.queryParams ?? {})
    const queryString =
      queryParams.length > 0
        ? '?' +
          queryParams
            .map(
              (param) =>
                `${param.name}=${encodeURIComponent(
                  applyFormula(param.formula, formulaContext),
                )}`,
            )
            .join('&')
        : ''
    const headers = isFormula(api.headers) // this is supporting a few legacy cases where the whole header object was set as a formula. This is no longer possible
      ? applyFormula(api.headers, {
          data,
          component: ctx.component,
          formulaCache: ctx.formulaCache,
          root: ctx.root,
          package: ctx.package,
          toddle: ctx.toddle,
          env: ctx.env,
        })
      : mapValues(api.headers ?? {}, (value) =>
          applyFormula(value, {
            data,
            component: ctx.component,
            formulaCache: ctx.formulaCache,
            root: ctx.root,
            package: ctx.package,
            toddle: ctx.toddle,
            env: ctx.env,
          }),
        )
    const contentType = String(
      Object.entries(headers).find(
        ([key]) => key.toLocaleLowerCase() === 'content-type',
      )?.[1],
    )
    const method = api.method ?? 'GET'
    const body =
      api.body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
        ? encodeBody(
            applyFormula(api.body, {
              data,
              component: ctx.component,
              formulaCache: ctx.formulaCache,
              root: ctx.root,
              package: ctx.package,
              toddle: ctx.toddle,
              env: ctx.env,
            }),
            contentType,
          )
        : undefined
    return {
      url: baseUrl + urlPath + queryString,
      method,
      auth: api.auth,
      headers,
      body,
    }
  }

  // extract the response body
  async function getBody(res: Response) {
    const textBody = await res.text()
    try {
      return parseJSONWithDate(textBody)
    } catch {
      return textBody
    }
  }

  function encodeBody(body: any, contentType?: string): FormData | string {
    switch (contentType) {
      case 'application/x-www-form-urlencoded': {
        if (typeof body === 'object' && body !== null) {
          return Object.entries(body)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return value
                  .map(
                    (v) =>
                      `${encodeURIComponent(key)}=${encodeURIComponent(v)}`,
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

  function apiSuccess(data: any) {
    ctx.dataSignal.set({
      ...ctx.dataSignal.get(),
      Apis: {
        ...ctx.dataSignal.get().Apis,
        [api.name]: {
          data,
          error: null,
          isLoading: false,
        },
      },
    })
    api.onCompleted?.actions?.forEach((action) => {
      handleAction(action, ctx.dataSignal.get(), ctx)
    })
  }

  function apiError(error: any) {
    ctx.dataSignal.set({
      ...ctx.dataSignal.get(),
      Apis: {
        ...ctx.dataSignal.get().Apis,
        [api.name]: {
          data: null,
          isLoading: false,
          error: error,
        },
      },
    })
    api.onFailed?.actions?.forEach((action) => {
      handleAction(action, ctx.dataSignal.get(), ctx)
    })
  }

  // Execute the request to the cloudflare Query proxy
  async function execute(payload: ApiRequest) {
    ctx.dataSignal.set({
      ...ctx.dataSignal.get(),
      Apis: {
        ...ctx.dataSignal.get().Apis,
        [api.name]: {
          data: ctx.dataSignal.get().Apis?.[api.name]?.data ?? null,
          isLoading: true,
          error: null,
        },
      },
    })
    let response

    try {
      if (api.proxy === false) {
        response = await fetch(payload.url, {
          method: payload.method,
          headers: payload.headers,
          body: payload.body,
        })
      } else {
        response = await fetch(
          `/_query/${encodeURIComponent(
            ctx.component.name,
          )}.${encodeURIComponent(api.name)}`,
          {
            method: 'POST',
            body: JSON.stringify(payload),
            signal: ctx.abortSignal,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )
      }
      const data = await getBody(response)
      if (response.ok) {
        apiSuccess(data)
      } else {
        throw data
      }
    } catch (error: any) {
      apiError(error)
      return Promise.reject(error)
    }
  }

  // Handles throttle and debounce if set.
  function trigger(body: ApiRequest) {
    if (typeof api.debounce === 'number') {
      return new Promise((resolve, reject) => {
        if (typeof timer === 'number') {
          clearTimeout(timer)
        }
        timer = setTimeout(() => {
          execute(body).then(resolve, reject)
        }, api.debounce as number)
      })
    } else if (typeof api.throttle === 'number') {
      if (typeof timer === 'number') {
        return new Promise(() => {})
      }
      timer = setTimeout(() => {
        if (typeof timer === 'number') {
          clearTimeout(timer)
        }
      }, api.throttle)
      return execute(body)
    } else {
      return execute(body)
    }
  }

  let payloadSignal: Signal<ApiRequest> | undefined
  ctx.dataSignal.update((data) => {
    return {
      ...data,
      Apis: {
        ...(data.Apis ?? {}),
        [api.name]: data.Apis?.[api.name] ?? {
          data: null,
          isLoading:
            api.autoFetch &&
            applyFormula(api.autoFetch, {
              data: ctx.dataSignal.get(),
              component: ctx.component,
              formulaCache: ctx.formulaCache,
              root: ctx.root,
              package: ctx.package,
              toddle: ctx.toddle,
              env: ctx.env,
            })
              ? true
              : false,
          error: null,
        },
      },
    }
  })
  if (api.autoFetch) {
    payloadSignal = ctx.dataSignal.map((data) => constructPayload(api, data))
    let firstRun = true
    payloadSignal.subscribe((body) => {
      if (
        api.autoFetch &&
        applyFormula(api.autoFetch, {
          data: ctx.dataSignal.get(),
          component: ctx.component,
          formulaCache: ctx.formulaCache,
          root: ctx.root,
          package: ctx.package,
          toddle: ctx.toddle,
          env: ctx.env,
        })
      ) {
        // We should only lookup cached data for pages since
        // we don't fetch data for component APIs during SSR
        if (firstRun && ctx.isRootComponent) {
          firstRun = false
          const cached = ctx.toddle?.pageState?.Apis?.[api.name]
          if (cached && cached.data) {
            if (typeof cached.data === 'string') {
              // Mimic the behavior from getBody and parse
              // the response to JSON if possible
              apiSuccess(parseJSONWithDate(cached.data))
            } else {
              apiSuccess(cached.data)
            }
          } else {
            trigger(body)
          }
        } else {
          trigger(body)
        }
      }
    })
  }
  return {
    fetch: (request?: ApiRequest) => {
      const apiPayload = constructPayload(api, ctx.dataSignal.get())
      let body = apiPayload.body
      // Use a Headers object since it's case insensitive
      const headers = new Headers({
        ...apiPayload.headers,
        ...(request?.headers ?? {}),
      })
      if (request?.body) {
        body = encodeBody(
          request.body,
          headers.get('Content-Type') ?? undefined,
        )
      }
      if (body instanceof FormData) {
        // Remove content type header if body is a FormData object
        // Otherwise fetch won't do its magic when sending the request
        headers.delete('Content-Type')
      }
      const payload: ApiRequest = {
        url: request?.url ?? apiPayload.url,
        method: request?.method ?? apiPayload.method,
        auth: request?.auth ?? apiPayload.auth,
        headers: mapHeadersToObject(headers),
        body,
      }
      return trigger(payload)
    },
    destroy: () => payloadSignal?.destroy(),
  }
}
