import type { EventModel } from '../component/component.types'
import type { Formula } from '../formula/formula'
import type { NordcraftMetadata, Nullable } from '../types'

export type ComponentAPI = LegacyComponentAPI | ApiRequest

export interface LegacyComponentAPI {
  name: string
  type: 'REST'
  autoFetch?: Nullable<Formula>
  url?: Nullable<Formula>
  path?: Nullable<{ formula: Formula }[]>
  proxy?: Nullable<boolean>
  queryParams?: Nullable<Record<string, { name: string; formula: Formula }>>
  headers?: Nullable<Record<string, Formula> | Formula>
  method?: Nullable<'GET' | 'POST' | 'DELETE' | 'PUT'>
  body?: Nullable<Formula>
  auth?: Nullable<{
    type: 'Bearer id_token' | 'Bearer access_token'
  }>
  throttle?: Nullable<number>
  debounce?: Nullable<number>
  onCompleted?: Nullable<EventModel>
  onFailed?: Nullable<EventModel>
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
  url?: Nullable<Formula>
  path?: Nullable<Record<string, { formula: Formula; index: number }>>
  queryParams?: Nullable<
    Record<
      string,
      // The enabled formula is used to determine if the query parameter should be included in the request or not
      { formula: Formula; enabled?: Nullable<Formula> }
    >
  >
  // hash is relevant for redirects and rewrites, but not for API calls
  hash?: Nullable<{ formula: Formula }>
}

export interface ApiRequest extends ApiBase {
  version: 2
  name: string
  type: 'http' | 'ws' // The structure for web sockets might look different
  autoFetch?: Nullable<Formula>
  headers?: Nullable<
    Record<string, { formula: Formula; enabled?: Nullable<Formula> }>
  >
  method?: Nullable<ApiMethod>
  body?: Nullable<Formula>
  // inputs for an API request
  inputs: Record<string, { formula: Nullable<Formula> }>
  service?: Nullable<string>
  servicePath?: Nullable<string>
  server?: Nullable<{
    // We should only accept server side proxy requests if proxy is defined
    proxy?: Nullable<{
      enabled: { formula: Formula }
      // Allow replacing template values in the body of a proxied request
      // This is useful for cases where the body should include an http only cookie for instance
      useTemplatesInBody?: Nullable<{ formula: Formula }>
    }>
    ssr?: Nullable<{
      // We should only fetch a request server side during SSR if this is true
      // it should probably be true by default for autofetch APIs
      // During SSR we will only fetch autoFetch requests
      enabled?: Nullable<{ formula: Formula }>
    }>
  }>
  client?: Nullable<{
    debounce?: Nullable<{ formula: Formula }>
    onCompleted?: Nullable<EventModel>
    onFailed?: Nullable<EventModel>
    onMessage?: Nullable<EventModel>
    // parserMode is used to determine how the response should be handled
    // auto: The response will be handled based on the content type of the response
    // stream: The response will be handled as a stream
    parserMode?: Nullable<ApiParserMode>
    // Whether to include credentials (cookies) in the request or not. Default is 'same-origin'
    credentials?: Nullable<'include' | 'same-origin' | 'omit'>
  }>
  // Shared logic for client/server 👇
  // The user could distinguish using an environment
  // variable e.g. IS_SERVER when they declare the formula

  // Rules for redirecting the user to a different page
  // These rules will run both on server+client - mostly used for 401 response -> 302 redirect
  // We allow multiple rules since it makes it easier to setup multiple conditions/redirect locations
  redirectRules?: Nullable<
    Record<
      string,
      {
        // The formula will receive the response from the server including a status code
        // A redirect response will be returned if the formula returns a valid url
        formula: Formula
        // The status code used in the redirect response. Only relevant server side
        statusCode?: Nullable<RedirectStatusCode>
        index: number
      }
    >
  >
  // Formula for determining whether the response is an error or not. Receives the API response + status code/headers as input
  // The response is considered an error if the formula returns true
  // Default behavior is to check if the status code is 400 or higher
  isError?: Nullable<{ formula: Formula }>
  // Formula for determining when the request should time out
  timeout?: Nullable<{ formula: Formula }>
}

export interface ApiStatus {
  data: unknown
  isLoading: boolean
  error: unknown
  response?: Nullable<{
    status?: Nullable<number>
    headers?: Nullable<Record<string, string>>
    performance?: Nullable<ApiPerformance>
    debug?: Nullable<unknown>
  }>
}

export interface ApiPerformance {
  requestStart?: Nullable<number>
  responseStart?: Nullable<number>
  responseEnd?: Nullable<number>
}

export interface ToddleRequestInit extends RequestInit {
  headers: Headers
}
