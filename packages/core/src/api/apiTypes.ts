import type { EventModel } from '../component/component.types'
import type { Formula } from '../formula/formula'
import type { NordcraftMetadata } from '../types'

export type ComponentAPI = LegacyComponentAPI | ApiRequest

export interface LegacyComponentAPI {
  name: string
  type: 'REST'
  autoFetch?: Formula | null
  url?: Formula
  path?: { formula: Formula }[]
  proxy?: boolean
  queryParams?: Record<string, { name: string; formula: Formula }>
  headers?: Record<string, Formula> | Formula
  method?: 'GET' | 'POST' | 'DELETE' | 'PUT'
  body?: Formula
  auth?: {
    type: 'Bearer id_token' | 'Bearer access_token'
  }
  throttle?: number | null
  debounce?: number | null
  onCompleted: EventModel | null
  onFailed: EventModel | null
  version?: never
}

export interface LegacyApiStatus {
  data: unknown
  isLoading: boolean
  error: unknown
  response?: never
}

export enum ApiMethod {
  GET = 'GET',
  POST = 'POST',
  DELETE = 'DELETE',
  PUT = 'PUT',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

export type RedirectStatusCode = 300 | 301 | 302 | 303 | 304 | 307 | 308

export type ApiParserMode =
  | 'auto'
  | 'text'
  | 'json'
  | 'event-stream'
  | 'json-stream'
  | 'blob'

export interface ApiBase extends NordcraftMetadata {
  url?: Formula
  path?: Record<string, { formula: Formula; index: number }>
  queryParams?: Record<
    string,
    // The enabled formula is used to determine if the query parameter should be included in the request or not
    { formula: Formula; enabled?: Formula | null }
  >
}

export interface ApiRequest extends ApiBase {
  version: 2
  name: string
  type: 'http' | 'ws' // The structure for web sockets might look different
  autoFetch?: Formula | null
  headers?: Record<string, { formula: Formula; enabled?: Formula | null }>
  method?: ApiMethod
  body?: Formula
  // inputs for an API request
  inputs: Record<string, { formula: Formula | null }>
  service?: string | null
  servicePath?: string | null
  server?: {
    // We should only accept server side proxy requests if proxy is defined
    proxy?: {
      enabled: { formula: Formula }
    } | null
    ssr?: {
      // We should only fetch a request server side during SSR if this is true
      // it should probably be true by default for autofetch APIs
      // During SSR we will only fetch autoFetch requests
      enabled?: { formula: Formula } | null
    }
  }
  client?: {
    debounce?: { formula: Formula } | null
    onCompleted?: EventModel | null
    onFailed?: EventModel | null
    onMessage?: EventModel | null
    // parserMode is used to determine how the response should be handled
    // auto: The response will be handled based on the content type of the response
    // stream: The response will be handled as a stream
    parserMode: ApiParserMode
  }
  // Shared logic for client/server 👇
  // The user could distinguish using an environment
  // variable e.g. IS_SERVER when they declare the formula

  // Rules for redirecting the user to a different page
  // These rules will run both on server+client - mostly used for 401 response -> 302 redirect
  // We allow multiple rules since it makes it easier to setup multiple conditions/redirect locations
  redirectRules?: Record<
    string,
    {
      // The formula will receive the response from the server including a status code
      // A redirect response will be returned if the formula returns a valid url
      formula: Formula
      // The status code used in the redirect response. Only relevant server side
      statusCode?: RedirectStatusCode | null
      index: number
    }
  > | null
  // Formula for determining whether the response is an error or not. Receives the API response + status code/headers as input
  // The response is considered an error if the formula returns true
  // Default behavior is to check if the status code is 400 or higher
  isError?: { formula: Formula } | null
  // Formula for determining when the request should time out
  timeout?: { formula: Formula } | null
}

export interface ApiStatus {
  data: unknown
  isLoading: boolean
  error: unknown
  response?: {
    status?: number
    headers?: Record<string, string> | null
    performance?: ApiPerformance
    debug?: null | unknown
  }
}

export interface ApiPerformance {
  requestStart: number | null
  responseStart: number | null
  responseEnd: number | null
}

export interface ToddleRequestInit extends RequestInit {
  headers: Headers
}
